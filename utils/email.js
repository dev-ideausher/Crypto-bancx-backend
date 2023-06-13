const nodemailer = require('nodemailer');
const Config = require('../config/config')
const pug = require('pug');

module.exports = class Email{
    constructor(user,data){
        this.to = user.email;
        this.data = data;
        this.from = `Crypto BancX <${Config.EMAIL_FROM}>`;
    }

    newTransport(){
        
        //sendgrid
        return nodemailer.createTransport({
            service:'SendGrid',
            auth:{
                user:Config.SENDGRID_USERNAME,
                pass:Config.SENDGRID_PASSWORD
            }
        });
    }

    async send(template,subject,body = null){
        // 1) Render Html template on a pug template
        const html = pug.renderFile(`./views/email/${template}.pug`,
        {
            name:this.name,
            email:this.email,
            data:this.data,
            subject,
            body:body,
        });

        // 2) Define email options
        const mailOptions = {
            from:this.from,
            to:this.to,
            subject:subject,
            html:html,
            // text:htmlToText.convert(html)
        }

        // 3) create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    };

    async sendWelcome(){
        await this.send('welcome','Welcome to the This web page');
    }

    // async sendEmailWithBody(subject,body){
    //     await this.send('welcomeTicketChecker',subject,body);
    // }

    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token (valid) for only 10min');
    }


    async forgotPassword(){
        await this.send("forgotPassword","Your reset Password link.")
    }

    async emailSubscription(){
        await this.send("subscriptionConfirmation","Your confirmation mail send to your mail.")
    }

};