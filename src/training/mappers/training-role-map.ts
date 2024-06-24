import { TrainingRole } from "../entities/training.entity";

export const TrainingRoleMap: {
    [key in TrainingRole]: string;
} = {
    [TrainingRole.ASSISTANT]: 'Asistente',
    [TrainingRole.ORGANIZER]: 'Organizador',
    [TrainingRole.SPEAKER]: 'Orador',
};