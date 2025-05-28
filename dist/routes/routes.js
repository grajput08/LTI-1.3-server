"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../db/config"));
const queries_1 = require("../db/queries");
const router = require("express").Router();
const path = require("path");
// Requiring Ltijs
const lti = require("ltijs").Provider;
const upload_middleware_1 = require("../middleware/upload.middleware");
const upload_service_1 = require("../services/upload.service");
// Test endpoint
router.get("/test", (req, res) => {
    res.json({
        status: "success",
        message: "Test endpoint is working!",
        timestamp: new Date().toISOString(),
    });
});
router.get("/resources", async (req, res) => {
    const resources = [
        {
            title: "Audio Record 1",
            duration: "3:45",
            artist: "Artist1",
            link: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
            transcript: {
                "0:04": "I'm Rodney, your interactive AI assistant here in the Dreamscape Learn universe, which is home to some fascinating intergalactic creatures like the Mega Rafi alien zoo, part of the Intergalactic Wildlife Sanctuary, is a virtual reality experience where you can explore diverse alien species and their habitats aimed at preserving endangered species across the galaxy.",
            },
        },
        {
            title: "Audio Record 2",
            duration: "4:20",
            artist: "Artist2",
            link: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
            transcript: {
                "0:29": "Are you excited to be at GSV?",
                "0:38": "Absolutely.",
                "0:39": "It's fantastic to be here at the 2025 ASU GSV summit, sharing the wonders of Dreamscape Learn with everyone.",
            },
        },
        {
            title: "Audio Record 3",
            duration: "2:55",
            artist: "Artist3",
            link: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
            transcript: {
                "0:45": "How about you?",
                "0:46": "Are you having a great time at the event?",
            },
        },
    ];
    return res.send(resources);
});
router.get("/info", async (req, res) => {
    const token = res.locals.token;
    const context = res.locals.context;
    const info = {};
    if (token.userInfo) {
        if (token.userInfo.name)
            info.name = token.userInfo.name;
        if (token.userInfo.email)
            info.email = token.userInfo.email;
    }
    if (context.roles)
        info.roles = context.roles;
    await queries_1.dbQueries.upsertUser({
        user_id: token.user,
        given_name: token.userInfo.given_name,
        family_name: token.userInfo.family_name,
        name: token.userInfo.name,
        email: token.userInfo.email,
        roles: context.roles,
    });
    return res.send(info);
});
router.post("/submit/audio", async (req, res) => {
    var _a;
    try {
        const resource = req.body;
        const token = res.locals.token;
        const roles = ((_a = res.locals.context) === null || _a === void 0 ? void 0 : _a.roles) || [];
        // Check if user is a student
        const isStudent = roles.some((role) => role.includes("Student") || role.includes("Learner"));
        // Only students can submit assignments
        if (!isStudent) {
            return res.status(403).send({
                error: "Only students can submit assignments",
            });
        }
        // Validate that this is a deep linking request
        if (!token || !token.platformContext) {
            return res.status(400).send({
                error: "Invalid token or context",
            });
        }
        // Validate required fields
        if (!resource.title || !resource.artist) {
            return res.status(400).send({
                error: "Missing required fields: title or artist",
            });
        }
        const items = [
            {
                type: "ltiResourceLink",
                title: resource.title,
                text: `Audio Recording Assignment: ${resource.title}`,
                url: token.platformContext.targetLinkUri,
                custom: {
                    resource_link_title: resource.link,
                    title: resource.title,
                    artist: resource.artist || "",
                    assignment_type: "audio_recording",
                    duration: resource.duration || 1200,
                    transcript: resource.transcript || {
                        "0:00": "No transcript available",
                        "0:29": "Are you excited to be at GSV?",
                        "0:38": "Absolutely.",
                        "0:39": "It's fantastic to be here at the 2025 ASU GSV summit, sharing the wonders of Dreamscape Learn with everyone.",
                    },
                },
                userInfo: {
                    user_id: token.user,
                    given_name: token.userInfo.given_name,
                    family_name: token.userInfo.family_name,
                    name: token.userInfo.name,
                    email: token.userInfo.email,
                },
            },
        ];
        try {
            const responseJson = {
                token,
                items,
                resource,
            };
            // Save to database
            const submissionData = {
                userId: token.user,
                title: resource.title,
                artist: resource.artist,
                link: resource.link,
                duration: resource.duration || 1200,
                createdAt: new Date(),
                platformContext: token.platformContext,
                items: items,
            };
            await queries_1.dbQueries.createSubmission(submissionData);
            return res.send(responseJson);
        }
        catch (dlError) {
            if (dlError instanceof Error) {
                return res.status(400).send({
                    error: "This route must be accessed through a deep linking launch from your LMS",
                });
            }
            throw dlError;
        }
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(500).send({ error: err.message });
        }
        return res.status(500).send({ error: "Unknown error occurred" });
    }
});
/**
 * sendGrade
 */
router.post("/grade", async (req, res) => {
    try {
        const idtoken = res.locals.token;
        const score = req.body.grade;
        const gradeObj = {
            userId: idtoken.user,
            scoreGiven: score,
            scoreMaximum: 100,
            activityProgress: "Completed",
            gradingProgress: "FullyGraded",
        };
        let lineItemId = idtoken.platformContext.endpoint.lineitem;
        if (!lineItemId) {
            const response = await lti.Grade.getLineItems(idtoken, {
                resourceLinkId: true,
            });
            const lineItems = response.lineItems;
            if (lineItems.length === 0) {
                const newLineItem = {
                    scoreMaximum: 100,
                    label: "Grade",
                    tag: "grade",
                    resourceLinkId: idtoken.platformContext.resource.id,
                };
                const lineItem = await lti.Grade.createLineItem(idtoken, newLineItem);
                lineItemId = lineItem.id;
            }
            else
                lineItemId = lineItems[0].id;
        }
        const responseGrade = await lti.Grade.submitScore(idtoken, lineItemId, gradeObj);
        return res.send("Hello");
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(500).send({ error: err.message });
        }
        return res.status(500).send({ error: "An unknown error occurred" });
    }
});
router.get("/submitted/audio", async (req, res) => {
    var _a;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const token = res.locals.token;
        const roles = ((_a = res.locals.context) === null || _a === void 0 ? void 0 : _a.roles) || [];
        // Check if user is an instructor/admin
        const isInstructor = roles.some((role) => role.includes("Instructor") ||
            role.includes("Administrator") ||
            role.includes("SysAdmin"));
        // Modify query based on role
        let countQuery = "SELECT COUNT(*) FROM submissions";
        let selectQuery = "SELECT * FROM submissions";
        const queryParams = [];
        // If not instructor, only show user's own submissions
        if (!isInstructor) {
            countQuery += " WHERE userid = $1";
            selectQuery += " WHERE userid = $1";
            queryParams.push(token.user);
        }
        selectQuery +=
            ' ORDER BY "createdat" DESC LIMIT $' +
                (queryParams.length + 1) +
                " OFFSET $" +
                (queryParams.length + 2);
        queryParams.push(limit, offset);
        const countResult = await config_1.default.query(countQuery, !isInstructor ? [token.user] : []);
        const totalItems = parseInt(countResult.rows[0].count);
        const result = await config_1.default.query(selectQuery, queryParams);
        // Transform the submissions data
        const formattedSubmissions = result.rows.map((submission) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            return ({
                id: submission.id,
                user: {
                    id: submission.userid,
                    name: ((_b = (_a = submission.items[0]) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.name) || "",
                    email: ((_d = (_c = submission.items[0]) === null || _c === void 0 ? void 0 : _c.userInfo) === null || _d === void 0 ? void 0 : _d.email) || "",
                    givenName: ((_f = (_e = submission.items[0]) === null || _e === void 0 ? void 0 : _e.userInfo) === null || _f === void 0 ? void 0 : _f.given_name) || "",
                    familyName: ((_h = (_g = submission.items[0]) === null || _g === void 0 ? void 0 : _g.userInfo) === null || _h === void 0 ? void 0 : _h.family_name) || "",
                },
                submission: {
                    title: submission.title,
                    artist: submission.artist,
                    link: submission.link,
                    feedback: submission.feedback,
                    feedbackBy: submission.feedback_by,
                    feedbackAt: submission.feedback_at,
                    transcript: ((_k = (_j = submission.items[0]) === null || _j === void 0 ? void 0 : _j.custom) === null || _k === void 0 ? void 0 : _k.transcript) || {},
                    duration: {
                        seconds: submission.duration,
                        formatted: formatDuration(submission.duration),
                    },
                    createdAt: submission.createdat,
                },
                context: {
                    courseTitle: ((_m = (_l = submission.platformcontext) === null || _l === void 0 ? void 0 : _l.context) === null || _m === void 0 ? void 0 : _m.title) || "",
                    courseLabel: ((_p = (_o = submission.platformcontext) === null || _o === void 0 ? void 0 : _o.context) === null || _p === void 0 ? void 0 : _p.label) || "",
                    roles: ((_q = submission.platformcontext) === null || _q === void 0 ? void 0 : _q.roles) || [],
                    resourceTitle: ((_s = (_r = submission.platformcontext) === null || _r === void 0 ? void 0 : _r.resource) === null || _s === void 0 ? void 0 : _s.title) || "",
                },
            });
        });
        return res.send({
            submissions: formattedSubmissions,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / limit),
            },
            isInstructor, // Adding this to help frontend know user's role
        });
    }
    catch (error) {
        return res.status(500).send({ error: "Failed to fetch submissions" });
    }
});
router.post("/feedback", async (req, res) => {
    var _a;
    try {
        const { submissionId, feedback } = req.body;
        const token = res.locals.token;
        const roles = ((_a = res.locals.context) === null || _a === void 0 ? void 0 : _a.roles) || [];
        // Check if user is an instructor/admin
        const isInstructor = roles.some((role) => role.includes("Instructor") ||
            role.includes("Administrator") ||
            role.includes("SysAdmin"));
        // Only instructors can provide feedback
        if (!isInstructor) {
            return res.status(403).send({
                error: "Only instructors can provide feedback",
            });
        }
        // Validate required fields
        if (!submissionId || feedback === undefined) {
            return res.status(400).send({
                error: "Missing required fields: submissionId or feedback",
            });
        }
        // Update the submission with feedback
        await config_1.default.query("UPDATE submissions SET feedback = $1, feedback_by = $2, feedback_at = $3 WHERE id = $4", [feedback, token.user, new Date(), submissionId]);
        return res.send({
            message: "Feedback saved successfully",
            submissionId,
            feedback,
        });
    }
    catch (error) {
        return res.status(500).send({ error: "Failed to save feedback" });
    }
});
// Helper function to format duration from seconds to mm:ss
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
// Names and Roles route
router.get("/members", async (req, res) => {
    try {
        const result = await lti.NamesAndRoles.getMembers(res.locals.token);
        if (result) {
            return res.send(result.members);
        }
        return res.status(500).send({ error: "Failed to fetch members" });
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(500).send({ error: err.message });
        }
        return res.status(500).send({ error: "An unknown error occurred" });
    }
});
// Upload audio file route
router.post("/upload/audio", upload_middleware_1.upload.single("audio"), async (req, res) => {
    var _a;
    try {
        if (!req.file) {
            return res.status(400).send({ error: "No audio file provided" });
        }
        const token = res.locals.token;
        const roles = ((_a = res.locals.context) === null || _a === void 0 ? void 0 : _a.roles) || [];
        // Check if user is a student
        const isStudent = roles.some((role) => role.includes("Student") || role.includes("Learner"));
        if (!isStudent) {
            return res.status(403).send({
                error: "Only students can upload audio files",
            });
        }
        const result = await upload_service_1.uploadService.uploadAudioToS3(req.file.buffer, token.user, req.file.mimetype);
        // Save audio file information to database
        const audioFileData = {
            userId: token.user,
            fileName: req.file.originalname,
            fileUrl: result.fileUrl,
            mimeType: req.file.mimetype,
        };
        const dbResult = await queries_1.dbQueries.saveAudioFile(audioFileData);
        return res.status(200).send({
            message: "File uploaded successfully",
            ...result,
            ...dbResult.rows[0],
        });
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(500).send({ error: err.message });
        }
        return res.status(500).send({ error: "Failed to upload file" });
    }
});
router.get("/recordings", async (req, res) => {
    var _a;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const token = res.locals.token;
        const roles = ((_a = res.locals.context) === null || _a === void 0 ? void 0 : _a.roles) || [];
        // Check if user is an instructor/admin
        const isInstructor = roles.some((role) => role.includes("Instructor") ||
            role.includes("Administrator") ||
            role.includes("SysAdmin"));
        const { recordings, totalCount } = await queries_1.dbQueries.getRecordings(token.user, isInstructor, limit, offset);
        // Transform the results
        const userRecordings = recordings.rows.map((row) => ({
            user: {
                id: row.user_id,
                name: row.name,
                email: row.email,
                givenName: row.given_name,
                familyName: row.family_name,
            },
            recordings: row.recordings,
        }));
        return res.send({
            recordings: userRecordings,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            isInstructor,
        });
    }
    catch (error) {
        return res.status(500).send({ error: "Failed to fetch recordings" });
    }
});
// Update the catch-all route to handle the new paths
router.get("*", (req, res) => {
    const ltik = req.query.ltik;
    const path = req.path;
    // Preserve the original path when redirecting
    res.redirect(`http://localhost:4001${path}${ltik ? `?ltik=${ltik}` : ""}`);
});
exports.default = router;
