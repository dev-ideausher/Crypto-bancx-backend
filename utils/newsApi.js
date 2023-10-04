const axios = require('axios');

const get_news = async() => {

    const options = {
        method: 'GET',
        url: 'https://cryptocurrency-news2.p.rapidapi.com/v1/theguardian',
        headers: {
            'X-RapidAPI-Key': 'e21240cd18msh4dfc7b610338f9ep1d661bjsnce5d2f135661',
            'X-RapidAPI-Host': 'cryptocurrency-news2.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        // console.log(response.data);
        return response.data.data;
    } catch (error) {
        console.error(error);
    }

}

const get_crypto_news = async() => {


    const  api_key = "1bvxcanvjjxylmvp0npxwuhgzr9nsu5f3pqrvcai";


    const options = {
        method: 'GET',
        url: 'https://cryptonews-api.com/api/v1/category?section=general&items=10&page=1&token='+api_key
    };

    try {
        const response = await axios.request(options);
        // console.log(response.data);
        return response.data.data;
    } catch (error) {
        console.error(error);
    }

}



module.exports = {
    get_news,
    get_crypto_news
}