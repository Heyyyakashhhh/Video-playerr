import { Router } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";
import { verfiyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verfiyJwt); // Saare subscription routes authenticated hote hain

router.route("/c/:channelId")
    .post(toggleSubscription)
    .get(getUserChannelSubscribers);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;