export enum ERROR_CODES {
    TRAINING_CODE_ALREADY_EXISTS = 'TRAINING_CODE_ALREADY_EXISTS',
    DATE_RANGE_INVALID = 'DATE_RANGE_INVALID',
    TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES = 'TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES',
    QR_CODE_NOT_FOUND = 'QR_CODE_NOT_FOUND',
    PARTICIPANT_NOT_FOUND = 'PARTICIPANT_NOT_FOUND',
    TRAINING_NOT_COMPLETED = 'TRAINING_NOT_COMPLETED',
    TRAINING_NOT_HAVE_EXECUTIONS = 'TRAINING_NOT_HAVE_EXECUTIONS',
    MULTIPLE_ROLES_NOT_ALLOWED = 'MULTIPLE_ROLES_NOT_ALLOWED',
    TRAINING_ALREADY_COMPLETED = 'TRAINING_ALREADY_COMPLETED',
    INVALID_OTP = 'INVALID_OTP',
    INVALID_AUTHOR = 'INVALID_AUTHOR',
    POST_IS_NOT_PENDING_APPROVAL = 'POST_IS_NOT_PENDING_APPROVAL',
    USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
    NESTED_COMMENT_NOT_ALLOWED = 'NESTED_COMMENT_NOT_ALLOWED',
    POST_DOES_NOT_HAVE_CONTENT = 'POST_DOES_NOT_HAVE_CONTENT',
    INVALID_CHANGE_ROLE_REQUEST = 'INVALID_CHANGE_ROLE_REQUEST',
}

export const APP_ERRORS = {
    [ERROR_CODES.QR_CODE_NOT_FOUND]: {
        code: ERROR_CODES.QR_CODE_NOT_FOUND,
        message: 'The QR code is not valid.',
    },
    [ERROR_CODES.PARTICIPANT_NOT_FOUND]: {
        code: ERROR_CODES.PARTICIPANT_NOT_FOUND,
        message: 'The participant is not found.',
    },
    [ERROR_CODES.TRAINING_NOT_COMPLETED]: {
        code: ERROR_CODES.TRAINING_NOT_COMPLETED,
        message: 'The training is not completed.',
    },
    [ERROR_CODES.TRAINING_NOT_HAVE_EXECUTIONS]: {
        code: ERROR_CODES.TRAINING_NOT_HAVE_EXECUTIONS,
        message: 'The training does not have any executions.',
    },
    [ERROR_CODES.MULTIPLE_ROLES_NOT_ALLOWED]: {
        code: ERROR_CODES.MULTIPLE_ROLES_NOT_ALLOWED,
        message: 'Only the organizer can have more than one role.',
    },
    [ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS]: {
        code: ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS,
        message: 'The training code already exists.',
    },
    [ERROR_CODES.DATE_RANGE_INVALID]: {
        code: ERROR_CODES.DATE_RANGE_INVALID,
        message: 'The date range is invalid.',
    },
    [ERROR_CODES.TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES]: {
        code: ERROR_CODES.TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES,
        message: 'The training does not have participants with certificates.',
    },
    [ERROR_CODES.TRAINING_ALREADY_COMPLETED]: {
        code: ERROR_CODES.TRAINING_ALREADY_COMPLETED,
        message: 'The training is already completed.',
    },
    [ERROR_CODES.INVALID_OTP]: {
        code: ERROR_CODES.INVALID_OTP,
        message: 'The OTP is invalid.',
    },
    [ERROR_CODES.INVALID_AUTHOR]: {
        code: ERROR_CODES.INVALID_AUTHOR,
        message: 'You cannot create a post with a reference and an user id'
    },
    [ERROR_CODES.POST_IS_NOT_PENDING_APPROVAL]: {
        code: ERROR_CODES.POST_IS_NOT_PENDING_APPROVAL,
        message: 'The post is not pending approval'
    },
    [ERROR_CODES.USER_ALREADY_EXISTS]: {
        code: ERROR_CODES.USER_ALREADY_EXISTS,
        message: 'The user already exists'
    },
    [ERROR_CODES.NESTED_COMMENT_NOT_ALLOWED]: {
        code: ERROR_CODES.NESTED_COMMENT_NOT_ALLOWED,
        message: 'Nested comments only allowed one level deep'
    },
    [ERROR_CODES.POST_DOES_NOT_HAVE_CONTENT]: {
        code: ERROR_CODES.POST_DOES_NOT_HAVE_CONTENT,
        message: 'Post does not have content'
    },
    [ERROR_CODES.INVALID_CHANGE_ROLE_REQUEST]: {
        code: ERROR_CODES.INVALID_CHANGE_ROLE_REQUEST,
        message: 'Invalid change role request'
    },
}