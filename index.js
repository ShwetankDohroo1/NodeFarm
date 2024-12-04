const fs = require('fs'); 
const http = require('http'); 
const url = require('url');
const slugify = require('slugify');

const PORT = 3000;

//templates
const tempoverview = fs.readFileSync(`${__dirname}/template/overview.html`, 'utf-8');
const tempcard = fs.readFileSync(`${__dirname}/template/card.html`, 'utf-8');
const temproduct = fs.readFileSync(`${__dirname}/template/product.html`, 'utf-8');
const tempcart = fs.readFileSync(`${__dirname}/template/cart-item.html`, 'utf-8');
const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObject = JSON.parse(data);

//slugs for URLs
const slug = dataObject.map(el => slugify(el.productName, { lower: true }));

let cart = [];

//replace placeholders in templates
const replaceTemplate = (temp, product) => {
    let output = temp.replace(/{%PRODUCTNAME%}/g, product.productName);
    output = output.replace(/{%IMAGE%}/g, product.image);
    output = output.replace(/{%PRICE%}/g, product.price);
    output = output.replace(/{%FROM%}/g, product.from);
    output = output.replace(/{%NUTRIENTS%}/g, product.nutrients);
    output = output.replace(/{%QUANTITY%}/g, product.quantity);
    output = output.replace(/{%DESCRIPTION%}/g, product.description);
    output = output.replace(/{%ID%}/g, product.id);

    if(!product.organic) output = output.replace(/{%NOT_ORGANIC%}/g, 'not-organic');
    return output;
};

//server
const server = http.createServer((req, res) => {
    const { query, pathname } = url.parse(req.url, true);

    //overview page
    if (pathname === '/' || pathname === '/overview') {
        res.writeHead(200, { 'Content-type': 'text/html' });
        const cardsHtml = dataObject.map(el => replaceTemplate(tempcard, el)).join('');
        const output = tempoverview.replace('{%PRODUCT_CARDS%}', cardsHtml);
        res.end(output);
    }
    //product page
    else if (pathname === '/product') {
        const product = dataObject[query.id];
        res.writeHead(200, { 'Content-type': 'text/html' });
        const output = replaceTemplate(temproduct, product);
        res.end(output);
    }
    //add to cart
    else if (pathname === '/add-to-cart') {
        const product = dataObject[query.id];
        if (product) {
            cart.push(product);
            res.writeHead(302, { Location: '/cart' });
            res.end();
        } else {
            res.writeHead(404, { 'Content-type': 'text/html' });
            res.end('<h1>Product not found</h1>');
        }
    }
    //cart page
    else if (pathname === '/cart') {
        res.writeHead(200, { 'Content-type': 'text/html' });
    
        if (cart.length === 0) {
            const emptyMessage = `<p class="empty-message">Your cart is empty. Add some products!</p>`;
            res.end(tempcart.replace('{%CART_ITEMS%}', '').replace('{%EMPTY_CART_MESSAGE%}', emptyMessage));
        } else {
            const cartHtml = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-details">
                        <h2>${item.productName}</h2>
                        <p>Price: $${item.price}</p>
                        <p>Quantity: ${item.quantity}</p>
                    </div>
                </div>
            `).join('');
    
            res.end(tempcart.replace('{%CART_ITEMS%}', cartHtml).replace('{%EMPTY_CART_MESSAGE%}', ''));
        }
    }    
    //API
    else if (pathname === '/api') {
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(data);
    }
    //404
    else {
        res.writeHead(404, { 'Content-type': 'text/html' });
        res.end('<h1>Page not found!</h1>');
    }
});
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});