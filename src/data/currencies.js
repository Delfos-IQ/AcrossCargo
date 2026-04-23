export const currencyData = [
    { code: "USD", name: "US Dollar" }, { code: "EUR", name: "Euro" }, { code: "GBP", name: "British Pound" },
    { code: "JPY", name: "Japanese Yen" }, { code: "CAD", name: "Canadian Dollar" }, { code: "AUD", name: "Australian Dollar" },
    { code: "CHF", name: "Swiss Franc" }, { code: "CNY", name: "Chinese Yuan Renminbi" }, { code: "INR", name: "Indian Rupee" },
    { code: "BRL", name: "Brazilian Real" }, { code: "ZAR", name: "South African Rand" }, { code: "RUB", name: "Russian Ruble" },
    { code: "AOA", name: "Angolan Kwanza" }, { code: "AED", name: "UAE Dirham" }, { code: "SAR", name: "Saudi Riyal" },
    { code: "QAR", name: "Qatari Riyal" }, { code: "SGD", name: "Singapore Dollar" }, { code: "HKD", name: "Hong Kong Dollar" },
    { code: "KRW", name: "South Korean Won" }, { code: "NZD", name: "New Zealand Dollar" }, { code: "MXN", name: "Mexican Peso" },
].sort((a, b) => a.code.localeCompare(b.code));
