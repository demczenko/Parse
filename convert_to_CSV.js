const pushed_countries = []
const result = data.reduce((acc, item) => {
    if (!pushed_countries.includes(item.country)) {
        pushed_countries.push(item.country)
        acc.push({
            country: item.country,
            [item.name]: item.name,
            [item.name + "_src"]: item.src,
            [item.name + "_url"]: item.href,
            [item.name + "_main_id"]: item.main_id,
            [item.name + "_highPrice"]: item.highPrice,
            [item.name + "_lowPrice"]: item.lowPrice,
        })
    }

    return acc.map(product => {
        if (item.country === product.country) {
            return {
                ...product,
                [item.name]: item.name,
                [item.name + "_src"]: item.src,
                [item.name + "_url"]: item.href,
                [item.name + "_main_id"]: item.main_id,
                [item.name + "_highPrice"]: item.highPrice,
                [item.name + "_lowPrice"]: item.lowPrice,
            }
        }

        return product
    })
}, [])
