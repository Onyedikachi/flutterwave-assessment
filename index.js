const app = require("express")()
const bodyParser = require("body-parser")

const cors = require("cors")
const helmet = require("helmet")

const Joi = require("joi")
const validator = require("express-joi-validation").createValidator({})

const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console()
    ]
});

const port = process.env.PORT || 4000

app.use(helmet())
app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ limit: "52428800" }))


app.get("/", (req, res)=>{
    res.json({
        message: "My Rule-Validation API",
        status: "success",
        data: {
            name: "Nwosu Onyedikachi",
            github: "@onyedikachi",
            email: "onyedikachinwosu@rocketmail.com",
            mobile: "08139203980",
            twitter: "@NOI4christ"
        }
    })
});


app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    if (err.isBoom) {
        const { message } = err.data[0];
        res.status(err.output.statusCode).json({
        status: "error",
        message
        });
    } else if (err.status === 404) {
        res.status(404).json({
        status: "error",
        message: "Not Found"
        });
    } else {
        res.status(500).json({
        status: "error",
        message: err.message || "Something Went Wrong"
        });
    }
});

app.listen(port, logger.info(`Server listening on port ${port}`));