import { MAIL_USERNAME, MAIL_PASSWORD, APP_LARAVEL_URL } from '../config.js'
import { __dirname } from '../app.js'
import nodemailer from "nodemailer";
import { readFileSync } from 'fs';
import { DBNames } from "../db.js";
import { ObjectID } from 'mongodb';
class EmailsController {

    static async sendMailNextJourney(to, data) {


        const html = readFileSync(__dirname + '\\plantillas_email\\nextJoutney.html', "utf8");

        const compiled = html.replace("{{name}}", data.name).replace("{{acount_login}}", data.acount_login).replace("{{challenger_name}}", data.challenger_name).replace("{{fase_name}}", data.fase_name);


        const content = {
            subject: "Inscripción Aceptada.",
            html: compiled,

        }

        await this.sendMail(to, content)

        console.log("Ya")

    }

    // static async sendMailNextJourney(previusJourney, currentJourney, user_copy ) {

    //     const html = readFileSync(__dirname + '\\plantillas_email\\send_account_demo.html', "utf8");
    //     const name = "John";
    //     const compiled = html.replace("{{account}}", user.name);


    //     const content = {
    //         subject: "",
    //         html: compiled,

    //     }

    //     this.sendMail(content)


    // }

    static async sendMailAccountConfirmation(MongoClient, req, res) {
        try {
            console.log('entro')
            let users_draft_collection = MongoClient.collection(DBNames.users_draft);
            let user_draft = await users_draft_collection.findOne({ email: req.query.to });

            if (user_draft != null) {
                console.log('entro2')
                const html = readFileSync(__dirname + '\\plantillas_email\\validate_email.html', "utf8");

                const compiled = html.replaceAll("{{name}}", user_draft.name).replace("{{ruta}}", APP_LARAVEL_URL).replace("{{email_val}}", req.query.to).replace("{{code}}", req.query.code);
                const content = {
                    subject: "Codigo De Confirmacion Master Funds",
                    html: compiled,

                }
                await this.sendMail(req.query.to, content)
                return res.send({
                    success: true,
                    message: "OK",
                    data: { "message": "email enviado" }
                })
            } else {

            }
        } catch (error) {
            console.log(error)
            return res.send({
                success: false,
                message: "ERROR",
                data: { "message": "Error al enviar" }
            })
        }

    }


    static async sendMailInitJourney(Account, to) {
        try {
            const html = readFileSync(__dirname + '\\plantillas_email\\send_suscription_accepted.html', "utf8");
            const compiled = html.replaceAll("{{account_login}}", Account.login).replaceAll("{{account_password}}", Account.password);
            const content = {
                subject: "Credenciales cuenta demo",
                html: compiled,

            }
            await this.sendMail(to, content)
            return true;

        } catch (error) {
            console.log(error)
            return false;
        }

    }

    static async sendMail(to, content) {

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: MAIL_USERNAME, // tu usuario de gmail
                pass: MAIL_PASSWORD // tu contraseña de gmail
            }
        });

        let info = await transporter.sendMail({
            from: 'MasterFunds', // sender address
            to: to, // list of receivers
            subject: content.subject, // Subject line
            // text: content.text, // plain text body
            html: content.html // html body
        });

    }

}





export default EmailsController 