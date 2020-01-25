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
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			type: 'oauth2',
			user: 'teamenthiran@gmail.com',
			clientId: '876860462258-73n5e9mtpv0ducplfnpbumjmfiit4ko2.apps.googleusercontent.com',
			clientSecret: '0DiVnFhAHm1JG_HpIgJtDaQC',
			refreshToken: '1//04irIzTE4BWFoCgYIARAAGAQSNwF-L9IrF-iIa43Q0PDoTJqMoBMU12hgiKPjuxj8jx9dNyXhQUzFu8w5eMXtNAJhX67UJFAAFI0'
		},
		tls: {
			// do not fail on invalid certs
			rejectUnauthorized: false
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
			// res.redirect(DOMAIN + 'success');
			res.redirect('/success');
		}
	})
	
	
	// var API_KEY = '365ed8d028418265c841a76aeebd8ace-9dfbeecd-9d59e229';
	// var DOMAIN = 'YOUR_DOMAIN_NAME';
	// var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});
	
	// const data = {
	// from: 'Excited User <me@samples.mailgun.org>',
	// to: 'foo@example.com, bar@example.com',
	// subject: 'Hello',
	// text: 'Testing some Mailgun awesomeness!'
	// };
	
	// mailgun.messages().send(data, (error, body) => {
	// console.log(body);
	// });
	
})




// `${DOMAIN}success?name=${req.query.name}&email=${req.query.email}&mobile=${req.query.mobile}&branch=${req.query.branch}&year=${req.query.year}&college=${req.query.college}&event=${req.query.event}&amount=${req.query.amount}`

app.get('/paytm', (req, res) => {
	
	const orderId = shortid.generate();
	const customerId = shortid.generate();
	
	var paytmParams = {
		// "MID" : "uduSIE08328076085049",
		"MID" : "cuZBeb01092536643568",
		"WEBSITE" : "WEBSTAGING",
		"INDUSTRY_TYPE_ID" : "Retail",
		"CHANNEL_ID" : "WEB",
		"ORDER_ID" : orderId,
		"CUST_ID" : customerId,
		"MOBILE_NO" : req.query.mobile,
		"EMAIL" : req.query.email,
		"TXN_AMOUNT" : req.query.amount,
		"CALLBACK_URL" :`${DOMAIN}success?name=${req.query.name}&email=${req.query.email}&mobile=${req.query.mobile}&branch=${req.query.branch}&year=${req.query.year}&college=${req.query.college}&event=${req.query.event}&amount=${req.query.amount}`,
		
		// "CALLBACK_URL" :`http://127.0.0.1:3000/success?name=${req.query.name}&email=${req.query.email}&mobile=${req.query.mobile}&branch=${req.query.branch}&year=${req.query.year}&college=${req.query.college}&event=${req.query.event}&amount=${req.query.amount}`,
	};
	// tdm2TE!6kUP%vlUb
	// u#R7ezMHf4rNiJ3J
	checksum_lib.genchecksum(paytmParams, "u#R7ezMHf4rNiJ3J", function(err, checksum){
		
		var url = "https://securegw-stage.paytm.in/order/process";
		
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

app.post('/success', (req, res) => {
	
	if (req.body.RESPMSG === "Txn Success") {
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
			// res.redirect('/success');
		});
	} else {
		res.redirect('/failed');
	}
});

app.use('/success', express.static(__dirname + '/success.html'));
app.use('/failed', express.static(__dirname + '/failed.html'));

database.sync()
.then(()=>{
	console.log("SQL database synced");
	app.listen(process.env.PORT || PORT,()=>console.log(`Server Up and Running on ${DOMAIN}:${process.env.PORT || PORT}`));
});