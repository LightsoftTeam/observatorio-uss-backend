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
                    console.log({ info });
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
                <h1>¡Hola, ${name}!</h1>
                <p>Bienvenido a la comunidad de Observatorio USS. Nos complace tenerte con nosotros.</p>
                <p>La administración de Observatorio USS ha creado tu cuenta de acceso para que puedas comenzar a utilizar nuestros servicios.</p>
                <p>Para ingresar, utiliza tu correo electrónico junto con la siguiente contraseña temporal: <strong>${password}</strong></p>
                <p><a href="${process.env.OBSERVATORY_APP_URL}" style="color: #007bff; text-decoration: none;">Acceder a Observatorio USS</a></p>
                <p>Te recomendamos que actualices tu contraseña en cualquier momento desde tu perfil: <a href="${process.env.OBSERVATORY_APP_URL}/mi-cuenta" style="color: #007bff; text-decoration: none;">Mi Perfil</a></p>
                <p>¡Esperamos que disfrutes de todos los recursos y oportunidades que encontrarás en Observatorio USS!</p>
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
}
