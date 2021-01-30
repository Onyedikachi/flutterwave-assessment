const app = require("express")();
const bodyParser = require("body-parser");

const helmet = require("helmet");
const morgan = require("morgan");

const Joi = require("joi");

const querySchema = Joi.object({
    rule: Joi.object().keys({
        field: Joi.string().required(),
        condition: Joi.string()
        .valid("eq", "neq", "gt", "gte", "contains").required(),
        condition_value: Joi.any().required()
    }).required(),
    data: Joi.any().required()
});

const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console()
    ]
});

app.use(morgan(":method\t\t:url\t\t:status\t\t:response-time"));

app.use(helmet());

const port = process.env.PORT || 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "52428800" }));

app.get("/", (req, res)=>{
    res.status(200).json({
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

app.post("/validate-rule", async (req, res, next)=> {
    try {

        const value = await querySchema.validateAsync(req.body)

        const field = value["rule"]["field"]

        const condition = value["rule"]["condition"]
        const condition_value = value["rule"]["condition_value"]

        let field_value = ""

        field_value = value["data"][field]

        if (field.includes(".")){
            let fields = field.split(".")

            field_value = value["data"][fields[0]][fields[1]]
        }

        if (!field_value){
            throw new Error(`field ${field} is missing from data`)
        }

        const isValid = handleCondition(condition, field_value, condition_value)

        isValid ?
            res.status(200).json({
                message: `field ${field} successfully validated`,
                status: "success",
                data: {
                    validation: {
                        error: false,
                        field,
                        field_value,
                        condition,
                        condition_value
                    }
                }
            }):
            res.status(400).json({
                message: `field ${field} failed validation`,
                status: "error",
                data: {
                    validation: {
                        error: true,
                        field,
                        field_value,
                        condition,
                        condition_value
                    }
                }
            })
    } catch (error) {
        error.statusCode = 400
        next(error)
    }
});

const handleCondition = (condition, field_val, cond_val) => {
    switch(condition){
        case "eq":
            return field_val === cond_val
        case "neq":
            return field_val !== cond_val
        case "gt":
            return parseInt(field_val, 10) > parseInt(cond_val, 10)
        case "gte":
            return parseInt(field_val, 10) >= parseInt(cond_val, 10)
        case "contains":
            return field_val.includes(cond_val)
    }
};

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
            message,
            data: null
        });
    } else if (err.status === 404) {
        res.status(404).json({
            status: "error",
            message: "Not Found",
            data: null
        });
    } else {
        res.status(err.statusCode || 500).json({
            status: "error",
            message: err.message || "Something Went Wrong",
            data: null
        });
    }
});

app.listen(port, logger.info(`Server listening on port ${port}`));