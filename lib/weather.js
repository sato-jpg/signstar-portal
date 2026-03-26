export async function getAichiWeather() {
  try {
    // Open-Meteo API: 名古屋市 (Lat: 35.18, Lon: 136.91)
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=35.18&longitude=136.91&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo"
    );
    const data = await res.json();
    
    // コードを日本語の天気に変換
    const weatherCodeMap = {
      0: "快晴", 1: "晴れ", 2: "時々曇り", 3: "曇り",
      45: "霧", 48: "霧", 51: "小雨", 53: "雨", 55: "強い雨",
      61: "雨", 63: "雨", 65: "激しい雨", 71: "雪", 73: "雪",
      75: "猛吹雪", 80: "にわか雨", 81: "にわか雨", 82: "激しいにわか雨",
      95: "雷雨", 96: "雷雨", 99: "雷雨"
    };

    return {
      current: {
        temp: Math.round(data.current_weather.temperature),
        condition: weatherCodeMap[data.current_weather.weathercode] || "不明",
        code: data.current_weather.weathercode
      },
      today: {
        maxTemp: Math.round(data.daily.temperature_2m_max[0]),
        minTemp: Math.round(data.daily.temperature_2m_min[0]),
        rainProb: data.daily.precipitation_probability_max[0]
      }
    };
  } catch (error) {
    console.error("Weather Fetch Failed:", error);
    return null;
  }
}
