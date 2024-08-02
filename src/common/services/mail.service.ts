import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ApplicationLoggerService } from './application-logger.service';

@Injectable()
export class MailService {

    transporter: nodemailer.Transporter;

    constructor(
        private readonly logger: ApplicationLoggerService,
    ) {
        console.log(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async sendMail({
        to,
        template,
        subject,
    }) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: template,
        };

        this.logger.log(`Sending email ${JSON.stringify(mailOptions)}`);

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        });
    }

    async sendVerificationCode({ to, code, forceSend = false }) {
        const verificationOtpIsActive = (process.env.OTP_VERIFICATION_IS_ACTIVE || 'true') === 'true' || forceSend;
        if(!verificationOtpIsActive) {
            return;
        }
        const template = `
                <h1>Verification Code</h1>
                <p>Your verification code is: <b>${code}</b></p>
            `;

        return this.sendMail({
            to,
            template,
            subject: 'Verification Code',
        })
        .then(() => {
            this.logger.log(`Verification code sent to ${to}`);
        })
        .catch((error) => {
            this.logger.error(`Error sending verification code to ${to}`);
            this.logger.error(error.message);
        });
    }

    async sendPostRequestNotification({ to, post }) {
        const { title, slug, category } = post;
        //TODO: change this syntax to config file
        const postUrl = `${(process.env.POST_URL || 'http://localhost:5173')}/${category}/${slug}`;
        const template = `
                <h1>Tu solicitud de nuevo post ha sido aceptada.</h1>
                <p>Felicitaciones! Tu post <b>"${title}"</b> ha sido aceptado.</p>
                <p>Puedes verlo <a href="${postUrl}">aquí</a></p>
            `;
        return this.sendMail({
            to,
            template,
            subject: 'Observatorio USS - Post aceptado',
        })
        .then(() => {
            this.logger.log(`Post request notification sent to ${to}`);
        })
        .catch((error) => {
            this.logger.error(`Error sending post request notification to ${to}`);
            this.logger.error(error.message);
        });
    }
}
