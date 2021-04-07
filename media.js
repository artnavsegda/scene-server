exports.turn = function(parameters)
{
    console.log(parameters.power);
	console.log(parameters.location);
	console.log(parameters.source);
    return {result: "ok"}
}