export type DynamoAccessType = 'FULL' | 'READ';

const typeToActionsMap: Record<DynamoAccessType, string[]> = {
    FULL: ['dynamodb:DeleteItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem'],
    READ: ['dynamodb:GetItem']
}

export function getDynamoActionsForAccessType(type: DynamoAccessType){
    const actions = typeToActionsMap[type];
    if(actions === undefined) throw Error(`DynamoAccessType not supported: ${type}`);
    return actions;
}