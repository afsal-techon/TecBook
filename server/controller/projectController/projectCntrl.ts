import USER from "../../models/user";
import express, { Request, Response, NextFunction } from "express";
import CUSTOMER from "../../models/customer";
import { Types } from "mongoose";
import BRANCH from "../../models/branch";
import mongoose from "mongoose";
import PROJECT from "../../models/project";
import LOGENTRY from "../../models/logEntry";
import { parseTimeToMinutes } from "../../Helper/timeCalc";
import { log } from "console";

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      branchId,
      customerId,
      projectName,
      projectId,
      billingMethod,
      description,
      users,
      projectCost,
      costBudget,
      revenueBudget,
      ratePerHour,
      tasks,
    } = req.body;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required!" });
    }

    if (!customerId) {
      return res.status(400).json({ message: "CustomerId is required!" });
    }

    if (!projectName || projectName.trim() === "") {
      return res.status(400).json({ message: "project name is required!" });
    }

    if (!billingMethod) {
      return res.status(400).json({ message: "billingMethod is required!" });
    }

    if (billingMethod === "Fixed Cost for Project") {
      if (!projectCost || projectCost <= 0) {
        return res.status(400).json({ message: "project cost is required!" });
      }
    }

    if (billingMethod === "Based on Project Hours") {
      if (!ratePerHour || ratePerHour <= 0) {
        return res.status(400).json({
          message: "ratePerHour is required!",
        });
      }
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        message: "At least one task is required!",
      });
    }

    // Validate each task
    for (const t of tasks) {
      if (!t.taskName || t.taskName.trim() === "") {
        return res.status(400).json({ message: "Task name is required!" });
      }

      if (billingMethod === "Based on Task Hours") {
        if (!t.ratePerHour || t.ratePerHour <= 0) {
          return res.status(400).json({
            message: "Each task must include a valid ratePerHour!",
          });
        }
      }
    }

    const newProject = await PROJECT.create({
      branchId,
      customerId,
      projectName,
      projectId,
      billingMethod,
      description,
      users,
      projectCost: billingMethod === "Fixed Cost for Project" ? projectCost : 0,
      ratePerHour: billingMethod === "Based on Project Hours" ? ratePerHour : 0,
      tasks,
      costBudget,
      revenueBudget,
      createdById: userId,
    });

    return res.status(201).json({
      message: "Project created successfully",
      data: newProject,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const userRole = user.role;
    const filterBranchId = req.query.branchId as string;
    const search = ((req.query.search as string) || "").trim();

    // Pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // Determine allowed branches
    let allowedBranchIds: mongoose.Types.ObjectId[] = [];

    if (userRole === "CompanyAdmin") {
      const branches = await BRANCH.find({
        companyAdminId: userId,
        isDeleted: false,
      }).select("_id");

      allowedBranchIds = branches.map(
        (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
      );
    } else if (userRole === "User") {
      if (!user.branchId) {
        return res.status(400).json({
          message: "User is not assigned to any branch!",
        });
      }
      allowedBranchIds = [user.branchId];
    } else {
      return res.status(403).json({ message: "Unauthorized role!" });
    }

    // Branch filter (if selected)
    if (filterBranchId) {
      const filterId = new mongoose.Types.ObjectId(filterBranchId);

      if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        return res.status(403).json({
          message: "You are not authorized to view projects for this branch!",
        });
      }

      allowedBranchIds = [filterId];
    }

    // Base match conditions
    const matchStage: any = {
      branchId: { $in: allowedBranchIds },
      isDeleted: false,
    };

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },

      // Join Customer
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    ];

    // Search filter (projectName or projectCode)
    if (search.length > 0) {
      pipeline.push({
        $match: {
          $or: [
            { projectName: { $regex: search, $options: "i" } },
            { projectId: { $regex: search, $options: "i" } },
            { "customer.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Count before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await PROJECT.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // Sort, skip, limit
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Projection
    pipeline.push({
      $project: {
        branchId: 1,
        customerId: 1,
        projectName: 1,
        projectId: 1,
        billingMethod: 1,
        description: 1,
        users: 1,
        projectCost: 1,
        ratePerHour: 1,
        costBudget: 1,
        revenueBudget: 1,
        tasks: 1,
        createdAt: 1,

        "customer.name": 1,
        "customer.email": 1,
        "customer.phone": 1,
      },
    });

    // Execute pipeline
    const projects = await PROJECT.aggregate(pipeline);

    return res.status(200).json({
      data: projects,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      branchId,
      customerId,
      projectName,
      projectId,
      billingMethod,
      description,
      users,
      projectCost,
      ratePerHour,
      tasks,
      costBudget,
      revenueBudget,
    } = req.body;


    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectIid } = req.params;
    if (!projectId) {
      return res.status(400).json({ message: "projectId is required!" });
    }

    const existingProject = await PROJECT.findOne({
      _id: projectIid,
      isDeleted: false,
    });

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found!" });
    }

    if (branchId !== undefined && !branchId) {
      return res.status(400).json({ message: "branchId is required!" });
    }

    if (customerId !== undefined && !customerId) {
      return res.status(400).json({ message: "CustomerId is required!" });
    }

    if (projectName !== undefined && projectName.trim() === "") {
      return res.status(400).json({ message: "project name cannot be empty!" });
    }

    if (billingMethod !== undefined && billingMethod.trim() === "") {
      return res.status(400).json({ message: "billingMethod is required!" });
    }

    // Billing-based validations
    if (billingMethod === "Fixed Cost for Project") {
      if (!projectCost || projectCost <= 0) {
        return res
          .status(400)
          .json({ message: "projectCost is required and must be > 0!" });
      }
    }

    if (billingMethod === "Based on Project Hours") {
      if (!ratePerHour || ratePerHour <= 0) {
        return res
          .status(400)
          .json({ message: "ratePerHour is required and must be > 0!" });
      }
    }

    if (billingMethod === "Based on Task Hours") {
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
          message: "At least one task is required!",
        });
      }

      for (const t of tasks) {
        if (!t.taskName || t.taskName.trim() === "") {
          return res.status(400).json({ message: "Task name is required!" });
        }

        if (!t.ratePerHour || t.ratePerHour <= 0) {
          return res.status(400).json({
            message: "Each task must include a valid ratePerHour!",
          });
        }
      }
    }

    // === UPDATE LOGIC ===

    existingProject.branchId = branchId ?? existingProject.branchId;
    existingProject.customerId = customerId ?? existingProject.customerId;
    existingProject.projectName = projectName ?? existingProject.projectName;
    existingProject.projectId = projectId ?? existingProject.projectId;
    existingProject.billingMethod =
      billingMethod ?? existingProject.billingMethod;
    existingProject.description = description ?? existingProject.description;
    existingProject.users = users ?? existingProject.users;
    existingProject.costBudget = costBudget ?? existingProject.costBudget;
    existingProject.revenueBudget =
      revenueBudget ?? existingProject.revenueBudget;

    // Handle billing-based assignments
    if (billingMethod === "Fixed Cost for Project") {
      existingProject.projectCost = projectCost;
      existingProject.ratePerHour = 0;
    }

    if (billingMethod === "Based on Project Hours") {
      existingProject.ratePerHour = ratePerHour;
      existingProject.projectCost = 0;
    }

    if (billingMethod === "Based on Task Hours") {
      existingProject.tasks = tasks;
      existingProject.projectCost = 0;
      existingProject.ratePerHour = 0;
    }

    await existingProject.save();

    return res.status(200).json({
      message: "Project updated successfully",
      data: existingProject,
    });
  } catch (err) {
    next(err);
  }
};

const minutesToHHMM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

export const getOneProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const loggedInUserId = req.user?.id;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID!" });
    }

    // Validate logged-in user
    const loggedUser = await USER.findOne({
      _id: loggedInUserId,
      isDeleted: false,
    });

    if (!loggedUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }


    //  * 1️ GET PROJECT BASIC INFO
    
    const projectPipeline: any[] = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(projectId),
          isDeleted: false,
        },
      },

      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          let: { ids: "$users.userId" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$ids"] },
              },
            },
            {
              $project: {
                _id: 1,
                username: 1,
                email: 1,
                role: 1,
              },
            },
          ],
          as: "assignedUsers",
        },
      },

      {
        $project: {
          branchId: 1,
          customerId: 1,
          projectName: 1,
          projectId: 1,
          billingMethod: 1,
          description: 1,
          projectCost: 1,
          ratePerHour: 1,
          costBudget: 1,
          revenueBudget: 1,
          users: 1,
          tasks: 1,
          createdAt: 1,
          customer: {
            name: 1,
            email: 1,
            phone: 1,
          },
          assignedUsers: 1,
        },
      },
    ];

    const projectResult = await PROJECT.aggregate(projectPipeline);

    if (!projectResult.length) {
      return res.status(404).json({ message: "Project not found!" });
    }

    const project = projectResult[0];

    /**
     * 2️ COMMON TIMELOG PIPELINE
     */

    const baseTimeLogPipeline: any[] = [
      {
        $match: {
          projectId: new mongoose.Types.ObjectId(projectId),
          isDeleted: false,
        },
      },
      {
        $addFields: {
          minutes: { $toInt: "$timeSpent" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $addFields: {
          task: {
            $first: {
              $filter: {
                input: project.tasks,
                as: "t",
                cond: { $eq: ["$$t._id", "$taskId"] },
              },
            },
          },
        },
      },
    ];

    /**
     * 3️ PROJECT SUMMARY
     */

    const projectSummaryAgg = await LOGENTRY.aggregate([
      ...baseTimeLogPipeline,
      {
        $group: {
          _id: null,
          loggedMinutes: { $sum: "$minutes" },
          billableMinutes: {
            $sum: { $cond: ["$billable", "$minutes", 0] },
          },
          billedMinutes: { $sum: 0 },
          unbilledMinutes: {
            $sum: { $cond: ["$billable", "$minutes", 0] },
          },
          cost: {
            $sum: {
              $multiply: [
                { $divide: ["$minutes", 60] },
                {
                  $let: {
                    vars: {
                      staff: {
                        $first: {
                          $filter: {
                            input: project.users,
                            as: "u",
                            cond: { $eq: ["$$u.userId", "$userId"] },
                          },
                        },
                      },
                    },
                    in: { $ifNull: ["$$staff.ratePerHour", 0] },
                  },
                },
              ],
            },
          },
        },
      },
    ]);

    const summary =
      projectSummaryAgg[0] || {
        loggedMinutes: 0,
        billableMinutes: 0,
        billedMinutes: 0,
        unbilledMinutes: 0,
        cost: 0,
      };

    /**
     * 4️ USER-WISE DATA
     */

    const userWise = await LOGENTRY.aggregate([
      ...baseTimeLogPipeline,
      {
        $group: {
          _id: "$userId",
          name: { $first: "$user.username" },
          role: { $first: "$user.role" },
          loggedMinutes: { $sum: "$minutes" },
          billableMinutes: {
            $sum: { $cond: ["$billable", "$minutes", 0] },
          },
          billedMinutes: { $sum: 0 },
          unbilledMinutes: {
            $sum: { $cond: ["$billable", "$minutes", 0] },
          },
        },
      },
    ]);

    /**
     * 5️ TASK-WISE DATA
     */

    const taskWise = await LOGENTRY.aggregate([
      ...baseTimeLogPipeline,
      {
        $group: {
          _id: "$taskId",
          taskName: { $first: "$task.taskName" },
          type: {
            $first: {
              $cond: ["$task.billable", "Billable", "Non-Billable"],
            },
          },
          ratePerHour: { $first: "$task.ratePerHour" },
          loggedMinutes: { $sum: "$minutes" },
          billableMinutes: {
            $sum: { $cond: ["$billable", "$minutes", 0] },
          },
          billedMinutes: { $sum: 0 },
          unbilledMinutes: {
            $sum: { $cond: ["$billable", "$minutes", 0] },
          },
        },
      },
    ]);

    /**
     * -----------------------------------------------------
     * 6️ INCOME CALCULATION
     * -----------------------------------------------------
     */

    let income = 0;

    switch (project.billingMethod) {
      case "Fixed Cost for Project":
        income = project.projectCost;
        break;

      case "Based on Project Hours":
        income =
          (summary.billableMinutes / 60) * (project.ratePerHour || 0);
        break;

      case "Based on Task Hours":
        income = taskWise.reduce(
          (sum, t) =>
            sum + (t.billableMinutes / 60) * (t.ratePerHour || 0),
          0
        );
        break;

      case "Based on Staff Hours":
        income = userWise.reduce((sum, u) => {
          const staff = project.users.find(
            (x: any) => x.userId.toString() === u._id.toString()
          );
          return (
            sum +
            (u.billableMinutes / 60) * (staff?.ratePerHour || 0)
          );
        }, 0);
        break;
    }

    /**
     * -----------------------------------------------------
     * 7️ FINAL RESPONSE
     * -----------------------------------------------------
     */
    
    return res.status(200).json({
      project,
      summary: {
        income,
        cost: summary.cost,
        profit: income - summary.cost,
        loggedHours: minutesToHHMM(summary.loggedMinutes),
        billableHours: minutesToHHMM(summary.billableMinutes),
        billedHours: minutesToHHMM(summary.billedMinutes),
        unbilledHours: minutesToHHMM(summary.unbilledMinutes),
      },
      users: userWise.map((u) => ({
        userId: u._id,
        name: u.name,
        role: u.role,
        loggedHours: minutesToHHMM(u.loggedMinutes),
        billableHours: minutesToHHMM(u.billableMinutes),
        billedHours: minutesToHHMM(u.billedMinutes),
        unbilledHours: minutesToHHMM(u.unbilledMinutes),
      })),
      tasks: taskWise.map((t) => ({
        taskId: t._id,
        taskName: t.taskName,
        type: t.type,
        loggedHours: minutesToHHMM(t.loggedMinutes),
        billableHours: minutesToHHMM(t.billableMinutes),
        billedHours: minutesToHHMM(t.billedMinutes),
        unbilledHours: minutesToHHMM(t.unbilledMinutes),
      })),
    });
  } catch (error) {
    next(error);
  }
};

//time sheeet

export const createLogEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userid = req.user?.id;
    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      date,
      branchId,
      projectId,
      userId,
      taskId,
      billable,
      startTime,
      endTime,
      timeSpent,
      note,
    } = req.body;

    // -------- Required validations
    if (!userId)
      return res.status(400).json({ message: "User Id is required!" });
    if (!branchId)
      return res.status(400).json({ message: "Branch Id is required!" });
    if (!taskId)
      return res.status(400).json({ message: "Task Id is required!" });
    if (!projectId)
      return res.status(400).json({ message: "Project Id is required!" });

    const project = await PROJECT.findById(projectId);
    if (!project) {
      return res.status(400).json({ message: "Project not found!" });
    }

    // -------- Time validation (NO calculation)
    if (timeSpent) {
      if (typeof timeSpent !== "number" || timeSpent <= 0) {
        return res.status(400).json({
          message: "Valid timeSpent (minutes) is required",
        });
      }
    }

    const MAX_MINUTES_PER_DAY = 24 * 60; // 1440

    // Normalize date to start & end of day
    const logDate = new Date(date);
    logDate.setUTCHours(0, 0, 0, 0);

    const startOfDay = new Date(logDate);
    const endOfDay = new Date(logDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Aggregate total minutes already logged
    const existingLogs = await LOGENTRY.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          branchId: new mongoose.Types.ObjectId(branchId),
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: "$timeSpent" },
        },
      },
    ]);

    const alreadyLoggedMinutes = existingLogs[0]?.totalMinutes || 0;
    const incomingMinutes = timeSpent || 0;

    if (alreadyLoggedMinutes + incomingMinutes > MAX_MINUTES_PER_DAY) {
      return res.status(400).json({
        message: `User already has 24 hours logged on this date. Cannot exceed 24 hours.`,
      });
    }

    const logEntry = await LOGENTRY.create({
      branchId,
      date,
      projectId,
      userId,
      taskId,
      billable,
      startTime: startTime || null,
      endTime: endTime || null,
      timeSpent, // already in minutes
      note,
      createdById: userid,
    });

    return res.status(201).json({
      message: "Log entry created successfully",
      data: logEntry,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllLogEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const userRole = user.role;
    const filterBranchId = req.query.branchId as string;
    const search = ((req.query.search as string) || "").trim();

    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    let allowedBranchIds: mongoose.Types.ObjectId[] = [];

    if (userRole === "CompanyAdmin") {
      const branches = await BRANCH.find({
        companyAdminId: userId,
        isDeleted: false,
      }).select("_id");

      allowedBranchIds = branches.map(
        (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
      );
    } else if (userRole === "User") {
      if (!user.branchId) {
        return res.status(400).json({
          message: "User is not assigned to any branch!",
        });
      }
      allowedBranchIds = [user.branchId];
    } else {
      return res.status(403).json({ message: "Unauthorized role!" });
    }

    if (filterBranchId) {
      const filterId = new mongoose.Types.ObjectId(filterBranchId);
      if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        return res.status(403).json({
          message:
            "You are not authorized to view log entries for this branch!",
        });
      }
      allowedBranchIds = [filterId];
    }

    // -------------------------------
    //  MAIN AGGREGATION
    // -------------------------------
    const pipeline: any[] = [
      {
        $match: {
          branchId: { $in: allowedBranchIds },
          isDeleted: false,
        },
      },

      // Join USER
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Join PROJECT
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      // Join CUSTOMER via project.customerId
      {
        $lookup: {
          from: "customers",
          localField: "project.customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      // Extract matching TASK from project.tasks based on taskId
      {
        $addFields: {
          task: {
            $cond: [
              { $and: ["$taskId", "$project.tasks"] },
              {
                $first: {
                  $filter: {
                    input: "$project.tasks",
                    as: "t",
                    cond: { $eq: ["$$t._id", "$taskId"] },
                  },
                },
              },
              null,
            ],
          },
        },
      },
    ];

    // -------------------------------
    // 🔍 SEARCH FILTER
    // -------------------------------
    if (search.length > 0) {
      pipeline.push({
        $match: {
          $or: [
            { "project.projectName": { $regex: search, $options: "i" } },
            { "project.projectId": { $regex: search, $options: "i" } },
            { "user.name": { $regex: search, $options: "i" } },
            { "task.taskName": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Count Pipeline
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await LOGENTRY.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // Pagination
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Final Projection (clean JSON)
    pipeline.push({
      $project: {
        branchId: 1,
        date: 1,
        startTime: 1,
        endTime: 1,
        timeSpent: 1,
        billable: 1,
        note: 1,

        project: {
          _id: "$project._id",
          projectId: "$project.projectId",
          projectName: "$project.projectName",
          billingMethod: "$project.billingMethod",
          customer: "$customer.name",
        },

        user: {
          _id: "$user._id",
          name: "$user.username",
          email: "$user.email",
        },

        task: {
          _id: "$task._id",
          taskName: "$task.taskName",
          ratePerHour: "$task.ratePerHour",
          billable: "$task.billable",
        },

        createdAt: 1,
      },
    });

    const logs = await LOGENTRY.aggregate(pipeline);

    return res.status(200).json({
      data: logs,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const updateLogEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userid = req.user?.id;
    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { timeLogId } = req.params;

    const {
      date,
      branchId,
      projectId,
      userId,
      taskId,
      billable,
      startTime,
      endTime,
      timeSpent,
      note,
    } = req.body;

    // -------- Required validations
    if (!userId)
      return res.status(400).json({ message: "User Id is required!" });
    if (!branchId)
      return res.status(400).json({ message: "Branch Id is required!" });
    if (!projectId)
      return res.status(400).json({ message: "Project Id is required!" });

    // -------- Fetch existing log
    const existingLog = await LOGENTRY.findById(timeLogId);
    if (!existingLog) {
      return res.status(400).json({ message: "Time log not found!" });
    }

    // -------- Validate project
    const project = await PROJECT.findById(projectId);
    if (!project) {
      return res.status(400).json({ message: "Project not found!" });
    }

    // -------- Billing-based task validation
    // if (
    //   project.billingMethod === "Based on Task Hours" &&
    //   !taskId
    // ) {
    //   return res.status(400).json({
    //     message: "Task is required for task-based billing",
    //   });
    // }

    // -------- Time validation
    if (timeSpent !== undefined) {
      if (typeof timeSpent !== "number" || timeSpent <= 0) {
        return res.status(400).json({
          message: "Valid timeSpent (minutes) is required",
        });
      }
    }

    // -------- 24 HOUR VALIDATION (IMPORTANT)
    const MAX_MINUTES_PER_DAY = 24 * 60;

    const logDate = new Date(date || existingLog.date);
    logDate.setUTCHours(0, 0, 0, 0);

    const startOfDay = new Date(logDate);
    const endOfDay = new Date(logDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const dailyLogs = await LOGENTRY.aggregate([
      {
        $match: {
          _id: { $ne: existingLog._id }, //  exclude current log
          userId: new mongoose.Types.ObjectId(userId),
          branchId: new mongoose.Types.ObjectId(branchId),
          date: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: "$timeSpent" },
        },
      },
    ]);

    const alreadyLoggedMinutes = dailyLogs[0]?.totalMinutes || 0;
    const newMinutes =
      timeSpent !== undefined ? timeSpent : existingLog.timeSpent;

    if (alreadyLoggedMinutes + newMinutes > MAX_MINUTES_PER_DAY) {
      return res.status(400).json({
        message:
          "User already has 24 hours logged on this date. Cannot exceed 24 hours.",
      });
    }

    // -------- Update log entry
    const updatedLog = await LOGENTRY.findByIdAndUpdate(
      timeLogId,
      {
        branchId,
        date: logDate,
        projectId,
        userId,
        taskId: taskId || null,
        billable,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        timeSpent: newMinutes,
        note,
        // updatedById: userid,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Log entry updated successfully",
      data: updatedLog,
    });
  } catch (err) {
    next(err);
  }
};


export const deleteLogEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { timeLogId } = req.params;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!timeLogId) {
      return res.status(400).json({ message: "Log entry Id is required!" });
    }

    const logEntry = await LOGENTRY.findOne({ _id: timeLogId });
    if (!logEntry) {
      return res.status(404).json({ message: "Log entry not found!" });
    }

    // const itemExist = await ITEMS.findOne({
    //   quoteId: quoteId,
    //   isDeleted: false,
    // });

    // if (itemExist) {
    //   return res.status(400).json({
    //     message:
    //       "This category currently linked to Items. Please remove Items before deleting.",
    //   });
    // }

    await LOGENTRY.findByIdAndUpdate(timeLogId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      deletedBy: user.username,
    });

    return res.status(200).json({
      message: "Log entry deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};
