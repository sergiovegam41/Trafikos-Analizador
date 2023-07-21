import { MAIL_USERNAME, MAIL_PASSWORD } from '../config.js'
import { __dirname } from '../app.js'
import nodemailer from "nodemailer";
import { readFileSync } from 'fs';
class EmailsController {

    static async sendMailNextJourney(to,data) {


        const html = readFileSync(__dirname + '\\plantillas_email\\nextJoutney.html', "utf8");
      
        const compiled = html.replace(" {{name}}", data.name).replace(" {{acount_login}}", data.acount_login).replace(" {{challenger_name}}", data.challenger_name).replace(" {{fase_name}}", data.fase_name);


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

    static async  sendMail(to,content){

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