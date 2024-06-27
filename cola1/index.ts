import { AzureFunction, Context } from "@azure/functions"

const serviceBusQueueTrigger: AzureFunction = async function(context: Context, mySbMsg: any): Promise<void> {
    context.log('ServiceBus queue trigger function processed message', mySbMsg);
    context.log('Cola 1', 'JEEEEEEEEE');
};

export default serviceBusQueueTrigger;
