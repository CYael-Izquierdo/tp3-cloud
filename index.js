const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB({
    apiVersion: 'latest',
    endpoint: 'http://dynamodb:8000',
    region: 'us-west-2',
    credentials: {
        accessKeyId: '2345',
        secretAccessKey: '2345'
    }
});

const docClient = new AWS.DynamoDB.DocumentClient({
    apiVersion: 'latest',
    service: dynamodb
});

exports.handler = (event, context, callback) => {

    // env
    let id = (event.pathParameters || {}).idEnvio || false;
    let envio = JSON.parse(event.body) || false;

    // db
    let path_pendientes = event.path.includes('/envios/pendientes');
    let path_entregado = event.path.includes('/entregado');

    switch (event.httpMethod) {
        case "GET":
            if (path_pendientes) {
                var params = {
                    TableName: 'Envio',
                    IndexName: 'EnviosPendientesIndex'
                };
                dynamodb.scan(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: returned ${data.Items}`);
                        callback(null, response(200, parseListOfItems(data.Items)));
                    }
                });
                break;
            }
            if (id) {
                var params = {
                    TableName: 'Envio',
                    Key: {
                        id: id
                    }
                };
                docClient.get(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: returned ${data.Item}`);
                        callback(null, response(200, parseListOfItems(data.Items)));
                    }
                });
                break;
            }
            let params = {
                TableName: 'Envio'
            };
            dynamodb.scan(params, function (err, data) {
                if (err) {
                    console.log(`error`, err);
                    callback(err, null);
                }
                else {
                    console.log(`success: returned ${data.Items}`);
                    callback(null, response(200, parseListOfItems(data.Items)));
                }
            });
            break;
        case "POST":
            if (path_entregado && id) {
                var params = {
                    TableName: 'Envio',
                    Key: {
                        id: id
                    },
                    UpdateExpression: 'remove pendiente',
                    ReturnValues: 'ALL_NEW'
                };
                docClient.update(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: returned ${data.Attributes}`);
                        callback(null, response(201, data.Attributes));
                    }
                });
            }
            if (envio) {
                var params = {
                    TableName: 'Envio',
                    Item: envio
                };
                docClient.put(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: created ${envio}`);
                        callback(null, response(200, envio));
                    }
                });
            }
            break;
        default:
            console.log("Metodo no soportado (" + event.httpMethod
                + ")");
    }

    function response(status, data) {
        var response = {
            statusCode: status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT',
                'Access-Control-Allow-Origin': `https://localhost:3000`,
            },
            body: JSON.stringify(data),
            isBase64Encoded: false
        }
        return response;
    }

    function parseListOfItems(listOfItems) {
        var list = [];
        listOfItems.forEach(item => {
            list.push(parseItem(item))
        });
        return list;
    }

    function getSafe(fn, defaultVal) {
        try {
            return fn();
        } catch (e) {
            return defaultVal;
        }
    }

    function parseItem(Item) {
        let id = getSafe(() => Item.id.S, ''),
            fechaAlta = getSafe(() => Item.fechaAlta.S, ''),
            destino = getSafe(() => Item.destino.S, ''),
            email = getSafe(() => Item.email.S, ''),
            pendiente = getSafe(() => Item.pendiente.S, ''),
            salida = getSafe(() => Item.salida.S, '');

        var response = {
            id: id,
            fechaAlta: fechaAlta,
            destino: destino,
            email: email,
            pendiente: pendiente,
            salida: salida
        }
        return response;
    }
}
