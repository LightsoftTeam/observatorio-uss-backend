import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { OtpService } from 'src/common/services/otp.service';
import { Role, User } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { v4 as uuidv4 } from 'uuid';
import { TokenReason, UserToken } from 'src/common/entities/user-token.entity';
import { InjectModel } from '@nestjs/azure-database';
import { Container } from '@azure/cosmos';
import { MailService } from 'src/common/services/mail.service';
import { getResetPasswordTemplate } from '../templates/reset-password.template';
import { APP_ERRORS, ERROR_CODES } from 'src/common/constants/errors.constants';
import { errors } from 'playwright';

@Injectable()
export class UserTokensService {
    constructor(
        private readonly userService: UsersService,
        private readonly otpService: OtpService,
        private readonly mailService: MailService,
        private readonly logger: ApplicationLoggerService,
        @InjectModel(UserToken)
        private readonly userTokensContainer: Container,
    ) { }

    async sendResetPasswordOtp(email: string) {
        this.logger.debug(`Sending reset password OTP to ${email}`);
        const token = uuidv4();
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const now = new Date();
        const userToken: UserToken = {
            createdAt: now,
            userId: user.id,
            token,
            reason: TokenReason.PASSWORD_RESET,
            expiresAt: new Date(now.getTime() + 1000 * 60 * 5),
        }
        this.mailService.sendMail({
            subject: 'Recuperación de contraseña',
            to: email,
            template: getResetPasswordTemplate(token),
        });
        await this.userTokensContainer.items.create(userToken);
        return {
            message: 'OTP sent successfully'
        }
    }

    async validateAndGetUserToken({ token, reason }: { token: string, reason: TokenReason }) {
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.token = @token',
            parameters: [
                { name: '@token', value: token }
            ]
        };
        const { resources } = await this.userTokensContainer.items.query<UserToken>(querySpec).fetchAll();
        if (resources.length === 0) {
            this.logger.debug(`Token ${token} not found`);
            throw new BadRequestException(APP_ERRORS[ERROR_CODES.INVALID_OTP]);
        }
        const item = resources[0];
        if (item.reason !== reason) {
            this.logger.debug(`Token ${token} is not for ${reason}`);
            throw new BadRequestException(APP_ERRORS[ERROR_CODES.INVALID_OTP]);
        }
        const now = new Date();
        if (new Date(item.expiresAt) < now) {
            this.logger.debug(`Token ${token} expired`);
            throw new BadRequestException(APP_ERRORS[ERROR_CODES.INVALID_OTP]);
        }
        return item;
    }
}
