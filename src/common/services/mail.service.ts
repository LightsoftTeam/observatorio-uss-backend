import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ApplicationLoggerService } from './application-logger.service';
import { ApprovalStatus, Post } from 'src/posts/entities/post.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {

    transporter: nodemailer.Transporter;

    constructor(
        private readonly logger: ApplicationLoggerService,
    ) {
        console.log(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
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

        const sendMailIsActive = (process.env.SEND_MAIL_NOTIFICATIONS || 'true') === 'true';
        if (!sendMailIsActive) {
            this.logger.debug('Email sending is DISABLED. Returning success response.');
            return Promise.resolve({
                to: mailOptions.to,
            });
        }

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
        const postUrl = `${process.env.OBSERVATORY_APP_URL}/${category}/${slug}`;
        const requestsUrl = `${process.env.OBSERVATORY_APP_URL}/mis-solicitudes`;
        let template = ``;

        switch (approvalStatus) {
            case ApprovalStatus.PENDING:
                template = `
                    <h1>Tu solicitud está en revisión</h1>
                    <p>Tu publicación titulada <b>"${title}"</b> ha sido recibida y está pendiente de aprobación.</p>
                    <p>Te notificaremos una vez que haya sido revisada.</p>
                    <p>Puedes ver el estado de tus solicitudes <a href="${requestsUrl}" style="color: #007bff; text-decoration: none;">aquí</a>.</p>
                `;
                break;
            case ApprovalStatus.REJECTED:
                template = `
                    <h1>Tu publicación ha sido rechazada</h1>
                    <p>Lamentablemente, tu publicación <b>"${title}"</b> no ha sido aprobada.</p>
                    <p>Consulta los motivos del rechazo <a href="${requestsUrl}" style="color: #007bff; text-decoration: none;">aquí</a>.</p>
                `;
                break;
            case ApprovalStatus.APPROVED:
                template = `
                    <h1>¡Tu publicación ha sido aprobada!</h1>
                    <p>Felicidades, tu publicación <b>"${title}"</b> ha sido aprobada y ya está disponible.</p>
                    <p>Puedes verla <a href="${postUrl}" style="color: #007bff; text-decoration: none;">aquí</a>.</p>
                `;
                break;
            default:
                template = `
                    <h1>Estado desconocido</h1>
                    <p>Hubo un problema al procesar el estado de tu publicación <b>"${title}"</b>.</p>
                    <p>Por favor, intenta de nuevo más tarde o contacta con soporte.</p>
                `;
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

    async sendRegisterNotification({ user }: { user: Partial<User> }) {
        this.logger.debug(`Sending register notification to ${user.email}`);
        const { name, email: to } = user;
        const template = `
                <h1>¡Bienvenido, ${name}!</h1>
                <p>Nos alegra que te unas a la comunidad de Observatorio USS. Ahora puedes comenzar a explorar y disfrutar de todas nuestras funcionalidades.</p>
                <p><a href="${process.env.OBSERVATORY_APP_URL}" style="color: #007bff; text-decoration: none;">Accede a Observatorio USS aquí</a></p>
                <p>¡Esperamos que esta experiencia sea enriquecedora y productiva para ti!</p>
                <p>Saludos cordiales,<br>El equipo de Observatorio USS</p>
            `;

        return this.sendMail({
            to,
            template,
            subject: 'Bienvenido a Observatorio USS',
        })
            .then(() => {
                this.logger.log(`Welcome message sent to ${to}`);
            })
            .catch((error) => {
                this.logger.error(`Error welcome message to ${to}`);
                this.logger.error(error.message);
            });
    }

    async sendNewAccountWithPassword({
        user,
        password
    }) {
        const { name, email: to } = user;
        this.logger.debug(`Sending register notification to ${to}`);
        const template = `
            <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 20px;">¡Hola, ${name}!</h1>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Bienvenido a la comunidad de <strong>Observatorio USS</strong>. Nos complace tenerte con nosotros.
                </p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    La administración ha creado tu cuenta de acceso para que puedas comenzar a utilizar nuestros servicios.
                </p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Para ingresar, utiliza tu correo electrónico junto con la siguiente contraseña temporal:
                    <span style="display: inline-block; margin-top: 10px; background-color: #f1f1f1; padding: 8px 12px; border-radius: 4px; font-weight: bold; color: #333;">
                    ${password}
                    </span>
                </p>
                <p style="margin-top: 30px;">
                    <a href="${process.env.OBSERVATORY_APP_URL}/iniciar-sesion"
                    style="display: inline-block; padding: 12px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
                    Acceder a Observatorio USS
                    </a>
                </p>
                <p style="margin-top: 20px; color: #555; font-size: 16px; line-height: 1.6;">
                    Te recomendamos que actualices tu contraseña desde tu perfil:
                    <a href="${process.env.OBSERVATORY_APP_URL}/mi-cuenta" style="color: #007bff; text-decoration: none;">
                    Mi Perfil
                    </a>
                </p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    ¡Esperamos que disfrutes de todos los recursos y oportunidades que encontrarás en Observatorio USS!
                </p>
                <p style="margin-top: 30px; color: #888; font-size: 14px;">
                    Saludos cordiales,<br>El equipo de Observatorio USS
                </p>
                </div>
            </div>
            `;

        return this.sendMail({
            to,
            template,
            subject: 'Bienvenido a Observatorio USS',
        })
            .then(() => {
                this.logger.log(`Welcome message sent to ${to}`);
            })
            .catch((error) => {
                this.logger.error(`Error sending password to ${to}`);
                this.logger.error(error.message);
                throw new Error(`Error sending password to ${to}: ${error.message}`);
            });
    }
}
