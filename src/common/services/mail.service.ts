import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ApplicationLoggerService } from './application-logger.service';
import { ApprovalStatus, Post } from 'src/posts/entities/post.entity';

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

    async sendPostRequestNotification({ to, post, approvalStatus }: { to: string, post: Partial<Post>, approvalStatus: ApprovalStatus }) {
        const { title, slug, category } = post;
        //TODO: change this syntax to config file
        const postUrl = `${(process.env.OBSERVATORY_APP_URL || 'http://localhost:5173')}/${category}/${slug}`;
        let template = ``;
        
        switch(approvalStatus) {
            case ApprovalStatus.PENDING:
                template = `
                    <h1>Tu solicitud ha sido aceptada.</h1>
                    <p>Tu post <b>"${title}"</b> ha sido recibido y está pendiente de aprobación.</p>
                    <p>Te notificaremos cuando haya sido revisado.</p>
                `;
                break;
            case ApprovalStatus.REJECTED:
                template = `
                    <h1>Tu solicitud de nuevo post ha sido rechazada.</h1>
                    <p>Lamentablemente, tu post <b>"${title}"</b> ha sido rechazado.</p>
                    <p>Puedes verlo <a href="${postUrl}/mis-solicitudes/342423423-asda">aquí</a></p>
                `;
                break;
            case ApprovalStatus.APPROVED:
                template = `
                    <h1>Tu solicitud de nuevo post ha sido aceptada.</h1>
                    <p>Felicidades, tu post <b>"${title}"</b> ha sido aceptado.</p>
                    <p>Puedes verlo <a href="${postUrl}">aquí</a></p>
                `;
                break
            default:
                break;
        }
        return this.sendMail({
            to,
            template,
            subject: 'Observatorio USS - Solicitud de nuevo post',
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
