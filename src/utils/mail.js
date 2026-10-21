import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import { ApiError } from "./apiError.js";

const sendEmail = async(options)=>{
    const mailGenrator = new Mailgen({ 
        theme : "default",
        product:{
            name : "Vedio player",
            link : "https://chaicode.com"

        }

})

const emailText = mailGenrator.generatePlaintext(options.mailgenContent);
const emailBody = mailGenrator.generate(options.mailgenContent)
const transporter = nodemailer.createTransport({
       service : "gmail",
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    const mail = {
        from :"heyyyakash907@gmail.com",
        to:options.email,
        subject  : options.subject,
        text: emailText,
        html: emailBody,
    }
    try{
        await transporter.sendMail(mail)
    }catch(err){
        throw new ApiError(500 , "Error while during email sending")
    }

}

const emailVerficationMailgenContent = (username , verifcationLink)=>{
    return {
    body: {
        name: username,
        intro: 'Welcome to our video player ! We\'re very excited to have you on board.',
        action: {
            instructions: 'To verify your email please click on the following button ',
            button: {
                color: '#22BC66', // Optional action button color
                text: 'Verify ',
                link:verifcationLink
            }
        },
        outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
    }
};

}
const forgetPasswordMailgenContent = (username , resetPasswordUrl)=>{
    return {
    body: {
        name: username,
        intro: 'We got a request to the reset the password of your account',
        action: {
            instructions: 'To reset your password to click on the following link or button ',
            button: {
                color: '#22BC66', // Optional action button color
                text: 'Reset your password ',
                link:resetPasswordUrl
            }
        },
        outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
    }
};

}

export {emailVerficationMailgenContent, forgetPasswordMailgenContent,sendEmail}