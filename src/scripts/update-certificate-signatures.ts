// import { Training } from "src/training/entities/training.entity";
// import { trainingContainer } from "./db";

require('dotenv').config();

async function main(){
    // It already has the certificateSignatureUrls field
    // const {resources} = await trainingContainer.items.readAll<Training>().fetchAll();
    // for (const training of resources) {
    //     console.debug('Updating training', training.id);
    //     const certificateSignatureUrls = training.certificateSignatureUrl ? [training.certificateSignatureUrl] : [];
    //     training.certificateSignatureUrls = certificateSignatureUrls;
    //     console.debug('certificateSignatureUrls', certificateSignatureUrls);
    //     await trainingContainer.item(training.id, training.id).replace(training);
    //     console.debug('Training updated');
    // }
}

main();