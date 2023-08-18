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

module.exports = {
    get_news
}