import React, { useEffect, useState } from "react";

const CryptoPriceTicker = ({ currency = "usd", isPremium = false }) => {
  const [coin, setCoin] = useState("bitcoin");
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coinsList, setCoinsList] = useState([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [tickerData, setTickerData] = useState([]);

  const fetchWithRetry = async (url) => {
    while (true) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
      } catch (error) {
        console.error("API Fetch Error, retrying...", error);
        await new Promise(res => setTimeout(res, 2000)); 
      }
    }
  };

  useEffect(() => {
    const fetchCoinsList = async () => {
      const data = await fetchWithRetry(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
      );
      if (data) setCoinsList(data);
    };

    fetchCoinsList();
  }, []);

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      const data = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${currency}&include_24hr_change=true`
      );
      if (data && data[coin]) {
        setPrice(data[coin][currency] || "N/A");
        setChange(data[coin][`${currency}_24h_change`] || 0);
        setError(null);
      }
      setLoading(false);
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [coin, currency]);

  useEffect(() => {
    if (search.length > 0) {
      setSuggestions(
        coinsList.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  }, [search, coinsList]);

  useEffect(() => {
    const fetchTickerData = async () => {
      const stableData = await fetchWithRetry(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=stablecoins&order=volume_desc&per_page=5&page=1&sparkline=false"
      );
      const memeData = await fetchWithRetry(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=volume_desc&per_page=5&page=1&sparkline=false"
      );
      if (stableData && memeData) setTickerData([...stableData, ...memeData]);
    };

    fetchTickerData();
    const interval = setInterval(fetchTickerData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "10px", fontSize: "20px", background: "#222", color: "#fff", borderRadius: "8px", display: "inline-block", position: "relative", width: "350px" }}>
      <input
        type="text"
        placeholder="Search coin..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px", fontSize: "16px", width: "100%", background: "#fff", color: "#000", border: "1px solid #ccc" }}
      />
      {suggestions.length > 0 && (
        <ul style={{ background: "#fff", color: "#000", listStyle: "none", padding: "5px", position: "absolute", width: "100%", zIndex: 10, maxHeight: "150px", overflowY: "auto", border: "1px solid #ccc" }}>
          {suggestions.map((s) => (
            <li
              key={s.id}
              style={{ padding: "5px", cursor: "pointer", background: "#fff", color: "#000" }}
              onClick={() => {
                setCoin(s.id);
                setSearch("");
                setSuggestions([]);
              }}
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <select onChange={(e) => setCoin(e.target.value)} value={coin} style={{ marginBottom: "10px", padding: "5px", fontSize: "16px", width: "100%" }}>
        {coinsList.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <div>
        {loading ? "Loading..." : error ? <span style={{ color: "red" }}>{error}</span> : (
          <>
            <div>{coin.toUpperCase()}: {price} {currency.toUpperCase()}</div>
            <div style={{ color: change >= 0 ? "green" : "red" }}>{change.toFixed(2)}%</div>
          </>
        )}
      </div>
      <div style={{ background: "blue", color: "yellow", padding: "10px", borderRadius: "8px", marginTop: "10px", whiteSpace: "nowrap", overflow: "hidden", width: "100%" }}>
        <marquee behavior="scroll" direction="left" scrollamount="8">
          {tickerData.map((coin) => (
            <span key={coin.id} style={{ marginRight: "20px" }}>{coin.name}: {coin.current_price} USD</span>
          ))}
        </marquee>
      </div>
      {!isPremium && (
        <div style={{ fontSize: "12px", color: "#bbb", marginTop: "5px" }}>
          <a href="/upgrade" style={{ color: "#0af" }}>Upgrade to remove ads</a>
        </div>
      )}
    </div>
  );
};

export default CryptoPriceTicker;
