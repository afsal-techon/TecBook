import express from 'express';
import { createAdmin, getUser, loginUser } from '../controller/UserCntrl/UserAuth';
import { verifyUser } from '../middleware/auth';
const router = express.Router();


router.post('/create-admin',createAdmin)
router.post('/login',loginUser);
router.get('/user',verifyUser,getUser)






export default router;