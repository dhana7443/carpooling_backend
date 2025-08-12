const paymentService=require('./payment.service');

exports.getRideCost = async (req, res) => {
    const { requestId } = req.params;
    console.log("reqId:",requestId)
    const rideCostDetails = await paymentService.getRideCost(requestId);
    console.log(rideCostDetails);
    res.status(200).json(rideCostDetails);
};