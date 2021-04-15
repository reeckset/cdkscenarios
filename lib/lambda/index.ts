exports.handler = async function(event: any) {
    console.log("Lambda was called! Event: \n" + JSON.stringify(event, null, 2))
}