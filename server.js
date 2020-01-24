const checksum_lib = require('./checksum/checksum');

const express = require('express');
const shortid = require('shortid');
const cors = require('cors');

var nodemailer = require('nodemailer');




const { PORT, DOMAIN } = require('./environments');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(__dirname+"/"));

const {database,Customers}=require('./database');



app.get('/email',(req,res)=>{
	
	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'teamenthiran@gmail.com',
			pass: 'TeamEnthiran6.0'
		}
	});
	
	var mailOptions = {
		from: 'teamenthiran@gmail.com',
		to: req.query.mail,
		subject: 'Registration Confirmation',
		text: 'You are registered'
	};
	
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			res.redirect(DOMAIN + 'success');
		}
	})
	
})

// `${DOMAIN}success?name=${req.query.name}&email=${req.query.email}&mobile=${req.query.mobile}&branch=${req.query.branch}&year=${req.query.year}&college=${req.query.college}&event=${req.query.event}&amount=${req.query.amount}`

app.get('/paytm', (req, res) => {
	
	const orderId = shortid.generate();
	const customerId = shortid.generate();
	
	var paytmParams = {
		"MID" : "uduSIE08328076085049",
		"WEBSITE" : "WEBSTAGING",
		"INDUSTRY_TYPE_ID" : "Retail",
		"CHANNEL_ID" : "WEB",
		"ORDER_ID" : orderId,
		"CUST_ID" : customerId,
		"MOBILE_NO" : req.query.mobile,
		"EMAIL" : req.query.email,
		"TXN_AMOUNT" : req.query.amount,
		"CALLBACK_URL" : `${DOMAIN}success?name=${req.query.name}&email=${req.query.email}&mobile=${req.query.mobile}&branch=${req.query.branch}&year=${req.query.year}&college=${req.query.college}&event=${req.query.event}&amount=${req.query.amount}`,
	};
	
	checksum_lib.genchecksum(paytmParams, "tdm2TE!6kUP%vlUb", function(err, checksum){
		var url = "https://securegw.paytm.in/order/process";
		
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write('<html>');
		res.write('<head>');
		res.write('<title>Merchant Checkout Page</title>');
		res.write('</head>');
		res.write('<body>');
		res.write('<center><h1>Please do not refresh this page...</h1></center>');
		res.write('<form method="post" action="' + url + '" name="paytm_form">');
		for(var x in paytmParams){
			res.write('<input type="hidden" name="' + x + '" value="' + paytmParams[x] + '">');
		}
		res.write('<input type="hidden" name="CHECKSUMHASH" value="' + checksum + '">');
		res.write('</form>');
		res.write('<script type="text/javascript">');
		res.write('document.paytm_form.submit();');
		res.write('</script>');
		res.write('</body>');
		res.write('</html>');
		res.end();
		
	});
});

// app.use('/payverify', express.static(__dirname + '/paytm.html'));

app.post('/register',(req,res)=>{
	Customers.findOne({
		where: {
			Email: req.body.Email,
			Mobile: req.body.Mobile,
			Event: req.body.Event
		}
	})
	.then(customer => {
		if (!customer) {
			res.status(200).json({
				message: "Send to register"
			});
		} else {
			res.status(200).json({
				message: "You're already registered"
			});
		}
	});
});

app.post('/finalize',(req,res)=>{
	var paytmChecksum = "";
	
	/**
	* Create an Object from the parameters received in POST
	* received_data should contains all data received in POST
	*/
	var paytmParams = {};
	for(var key in res){
		if(key == "CHECKSUMHASH") {
			paytmChecksum = res[key];
		} else {
			paytmParams[key] = res[key];
		}
	}
	
	/**
	* Verify checksum
	* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
	*/
	var isValidChecksum = checksum_lib.verifychecksum(paytmParams, "tdm2TE!6kUP%vlUb", paytmChecksum);
	if(isValidChecksum) {
		console.log("Checksum Matched");



	} else {
		console.log("Checksum Mismatched");
	}
})

app.post('/success', (req, res) => {
		Customers.create({
			OrderId: req.body.ORDERID,
			Name: req.query.name,
			Email: req.query.email,
			Mobile: req.query.mobile,
			Branch: req.query.branch,
			Year: req.query.year,
			CollegeName: req.query.college,
			Event: req.query.event,
			Amount: req.query.amount
		})
		.then(() => {
			res.redirect(`/email?mail=${req.query.email}`);
		});
});
app.use('/success', express.static(__dirname + '/success.html'));


database.sync()
.then(()=>{
	console.log("SQL database synced");
	app.listen(process.env.PORT || PORT,()=>console.log(`Server Up and Running on ${DOMAIN}:${process.env.PORT || PORT}`));
});
