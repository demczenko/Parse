const ids = [
  { id: "232789", name: "NEIVA", img: (country) => "https://beliani.info/newsletter/2022/231211Category11.png" },
  { id: "263355", name: "NEVIS", img: (country) => "https://beliani.info/newsletter/2022/231211Category12.png" },
];

async function parse_response(responses, cbs) {
  const responses_json = [];

  for (let index = 0; index < responses.length; index++) {
    const response = responses[index];
    if (response.status === "fulfilled") {
      if (response.value.ok) {
        const response_json = await response.value.json();
        responses_json.push(
          Array.isArray(cbs) ? cbs[index](response_json) : cbs(response_json)
        );
      } else {
        console.log("Response value is not ok while parsing slaves response.");
      }
    }

    if (response.status === "rejected") {
      console.log("Rejected 2");
    }
  }

  return responses_json;
}
async function request_data(products, url) {
  const promised_product = products.map((product) =>
    fetch("https://www.prologistics.info/api/condensedSA" + url(product.id))
  );
  const responses = await Promise.allSettled(promised_product);

  return responses;
}
async function parse_response_prices(slave_responses) {
  const prices = [];
  for (const slave_response of slave_responses) {
    if (slave_response.status === "fulfilled") {
      if (slave_response.value.ok) {
        // Iterate over each slave response
        const userName = {
          Beliani: "chde",
          "Beliani SP": "es",
          "Beliani AT": "at",
          "Beliani IT": "it",
          "Beliani UK": "uk",
          "Beliani FR": "fr",
          "Beliani DE": "de",
          "Beliani HU": "hu",
          "Beliani PT": "pt",
          "Beliani PL": "pl",
          "Beliani SE": "se",
          "Beliani NL": "nl",
          "Beliani DK": "dk",
          "Beliani CZ": "cz",
          "Beliani FI": "fi",
          "Beliani NO": "no",
          "Beliani SK": "sk",
        };
        const response_json = await slave_response.value.json();
        if (response_json.sa.saved_params.username in userName) {
          if (userName[response_json.sa.saved_params.username] === "chde") {
            prices.push({
              country: "chfr",
              lowPrice: response_json.sa.saved_params.ShopPrice,
              highPrice: response_json.sa.saved_params.ShopHPrice,
            });
          }
          prices.push({
            country: userName[response_json.sa.saved_params.username],
            lowPrice: response_json.sa.saved_params.ShopPrice,
            highPrice: response_json.sa.saved_params.ShopHPrice,
          });
        }
      } else {
        return "Response value is not ok while parsing prices.";
      }
    }

    if (slave_response.status === "rejected") {
      return "Rejected 2";
    }
  }
  return prices;
}

function parse_response_slaves_links(ShopSAAlias) {
  const links = [];
  const relativeLanguageToCountry = {
    polish: "pl",
    portugal: "pt",
    spanish: "es",
    german: "chde",
    germanDE: "de",
    Hungarian: "hu",
    finnish: "fi",
    french: "fr",
    czech: "cz",
    slovak: "sk",
    danish: "dk",
    italian: "it",
    swedish: "se",
    english: "uk",
    norsk: "no",
    dutch: "nl",
  };
  const origins = {
    german: "https://www.beliani.ch/",
    english: "https://www.beliani.co.uk/",
    germanDE: "https://www.beliani.de/",
    french: "https://www.beliani.fr/",
    germanAT: "https://www.beliani.at/",
    spanish: "https://www.beliani.es/",
    polish: "https://www.beliani.pl/",
    dutch: "https://www.beliani.nl/",
    portugal: "https://www.beliani.pt/",
    italian: "https://www.beliani.it/",
    swedish: "https://www.beliani.se/",
    Hungarian: "https://www.beliani.hu/",
    danish: "https://www.beliani.dk/",
    czech: "https://www.beliani.cz/",
    finnish: "https://www.beliani.fi/",
    norsk: "https://www.beliani.no/",
    slovak: "https://www.beliani.sk/",
  };
  Object.values(ShopSAAlias).forEach(({ language, value }) => {
    if (language in relativeLanguageToCountry) {
      if (relativeLanguageToCountry[language] === "fr") {
        links.push(
          {
            country: "chfr",
            href: origins["german"] + value + ".html",
          },
          {
            country: relativeLanguageToCountry[language],
            href: origins[language] + value + ".html",
          }
        );
        return;
      }

      if (relativeLanguageToCountry[language] === "de") {
        links.push(
          {
            country: "at",
            href: origins["germanAT"] + value + ".html",
          },
          {
            country: relativeLanguageToCountry[language],
            href: origins[language] + value + ".html",
          }
        );
        return;
      }

      links.push({
        country: relativeLanguageToCountry[language],
        href: origins[language] + value + ".html",
      });
    }
  });

  return links;
}

async function getProductData(product) {
  // 1 Get slaves id's for master id
  const main_id_slaves = fetch(
    `https://www.prologistics.info/api/condensedSA/getShops/?id=${product.id}`
  );
  const slaves_aliases = fetch(
    `https://www.prologistics.info/api/condensedSA/get/?id=${product.id}&block=ShopSAAlias`
  );

  const array_of_promises = await Promise.allSettled([
    main_id_slaves,
    slaves_aliases,
  ]);
  const parsed_response_slaves = await parse_response(array_of_promises, [
    (response) => response.slaves,
    (response) => parse_response_slaves_links(response.sa.ShopSAAlias),
  ]);
  const [slaves_ids, products_links] = parsed_response_slaves;

  const responses = await request_data(
    [...slaves_ids, { id: product.id }],
    (id) => `/getSlave/?id=${id}&block=saved_params`
  );

  const slaves_prices = await parse_response_prices(responses);

  const products = [];
  for (const { country: countryLink, href } of products_links) {
    for (const {
      country: countryPrice,
      lowPrice,
      highPrice,
    } of slaves_prices) {
      if (countryLink === countryPrice) {
        products.push({
          src: product.img(countryLink),
          name: product.name,
          main_id: product.id,
          country: countryLink,
          href,
          lowPrice,
          highPrice,
        });
      }
    }
  }

  return products;
}
const ids_response = await Promise.allSettled(
  ids.map((product) => getProductData(product))
);
console.log(
  ids_response.map((item) => {
    if (item.status === "rejected") {
      return "Promise rejected";
    } else {
      return item.value;
    }
  }).flat()
);
