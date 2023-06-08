import React, {useState, useEffect} from 'react';
import Papa from 'papaparse';
import {Typography} from '@mui/material';
import CanvasJSReact from '../lib/canvasjs.react';

let CanvasJSChart = CanvasJSReact.CanvasJSChart;

const MainPage = () => {
    const [data, setData] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [temperature, setTemperature] = useState(null);
    const [currentTemperature, setCurrentTemperature] = useState(0);
    const [currentHumidity, setCurrentHumidity] = useState(0);
    const [averageTemperature, setAverageTemperature] = useState(0);
    const [averageHumidity, setAverageHumidity] = useState(0);
    const [date, setDate] = useState(null);
    const [humidityPoints, setHumidityPoints] = useState([])
    const [temperaturePoints, setTemperaturePoints] = useState([])

    const getCurrentTemperature = () => {
        const temperature = parseFloat(data[data.length - 1][2]);
        const temperatureWithTwoDecimals = temperature.toFixed(2);
        setCurrentTemperature(parseFloat(temperatureWithTwoDecimals));
    };

    const getCurrentHumidity = () => {
        const humidity = parseFloat(data[data.length - 1][1]);
        const humidityWithTwoDecimals = humidity.toFixed(2);
        setCurrentHumidity(parseFloat(humidityWithTwoDecimals));
    };

    const getAverageTemperature = () => {
        const currentDate = date[date.length - 1];
        const previousDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        console.log(currentDate);
        console.log(previousDate);
        var counter = 0;
        var temperatures = 0;

        for(var i = 0; i < date.length; i++) {
            const checkDate = new Date(date[i]);
            console.log(checkDate);
            if (checkDate >= previousDate && checkDate <= currentDate) {
                counter++;
                temperatures = temperatures + parseFloat(temperature[i]);
                console.log("weszło")
            }
        }
        const average = temperatures / counter;
        console.log(temperatures);
        setAverageTemperature(average.toFixed(2));

    };

    const getAverageHumidity = () => {
        const currentDate = date[date.length - 1];
        const previousDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        var counter = 0;
        var humidities = 0;

        for(var i = 0; i < date.length; i++) {
            const checkDate = new Date(date[i]);
            if (checkDate >= previousDate && checkDate <= currentDate) {
                counter++;
                humidities = humidities + parseFloat(humidity[i]);
            }
        }
        const average = humidities / counter;
        setAverageHumidity(average.toFixed(2));

    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/dane_rzecz.txt');
                const text = await response.text();
                const csv = Papa.parse(text, {header: false});
                const parsedData = csv.data;

                setData(parsedData);
            } catch (error) {
                console.error('Error reading CSV file:', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => { //wziecie danych z ostatnich 3dni (DO ZROBIENIA SREDNIA Z GODZINY)
        if (data) {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const day = currentDate.getDate();

            var dateNow = new Date(year, month, day);
            var dates = [];
            var datesWithHours = [];
            var list_temp = [];
            var list_hum = [];

            for (var i = 0; i < 3; i++) {
                dates.push(dateNow.toDateString());
                dateNow.setDate(dateNow.getDate() - 1);
            };

            var counter = 0;
            var valueHumidity = 0;
            var valueTemperature = 0;
            var previousDate = new Date(data[0]);
            var previousHour = previousDate.getHours();

            for (var i = 0; i < dates.length; i++) {
                data.forEach((stat) => {
                    const date = new Date(stat[0]);
                    //console.log(date);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const day = date.getDate();

                    var dateStat = new Date(year, month, day);
                    const currentDate = new Date(dates[i]);
                    if (dateStat.getTime() === currentDate.getTime()) {
                        var hour = date.getHours();
                        if (hour === previousHour) {
                            counter++;
                            valueHumidity = parseFloat(valueHumidity) + parseFloat(stat[1]);
                            valueTemperature = parseFloat(valueTemperature) + parseFloat(stat[2]);
                        } else {
                            var averageHumidity = parseFloat(valueHumidity) / parseFloat(counter);
                            var averageTemperature = parseFloat(valueTemperature) / parseFloat(counter);
                            datesWithHours.push(previousDate);
                            list_hum.push(averageHumidity);
                            list_temp.push(averageTemperature);

                            counter = 1;
                            valueHumidity = stat[1];
                            valueTemperature = stat[2];
                            previousHour = hour;
                            previousDate = date;
                        }
                    }
                })
            };

            setHumidity(list_hum.map(x => parseFloat(x)));
            setTemperature(list_temp.map(x => parseFloat(x)));
            setDate(datesWithHours.map(x => new Date(x)));
            console.log(temperature);

            getCurrentTemperature();
            getCurrentHumidity();

        } else {
            setHumidity(null);
            setTemperature(null);
            setDate(null);
        }

    }, [data])


    useEffect(() => {
        if (temperature) {
            var tab = []
            for (var i = 0; i < temperature.length; i++) {
                tab.push({x: date[i], y: temperature[i]});
            }
            setTemperaturePoints(tab);
            console.log(temperaturePoints)

            getAverageTemperature();
        }
    }, [temperature])


    useEffect(() => {
        if (humidity) {
            var tab = []
            for (var i = 0; i < humidity.length; i++) {
                tab.push({x: date[i], y: humidity[i]});
            }
            setHumidityPoints(tab);
            getAverageHumidity();
        }
    }, [humidity])

    const options = {
        zoomEnabled: true,
        theme: "light2",
        title: {
            text: "Daily humidity",
            fontColor: "black"
        },
        axisX: {
            valueFormatString: "YYYY/MM/DD HH:mm",
            labelAngle: -45,
            title: "Date",
            interlacedColor: "#F0F8FF"
        },
        axisY: {
            title: "Humidity [%]"
        },
        data: [{
            type: "line",
            dataPoints: humidityPoints
        }]
    }

    const options2 = {
        zoomEnabled: true,
        theme: "light2",
        title: {
            text: "Daily temperature",
            fontColor: "black"
        },
        axisX: {
            valueFormatString: "YYYY/MM/DD HH:mm",
            labelAngle: -45,
            title: "Date",
            interlacedColor: "#F0F8FF"
        },
        axisY: {
            title: "Temperature [ºC]"
        },
        data: [{
            type: "line",
            dataPoints: temperaturePoints
        }
        ]
    }

    return (
        <div>
            <Typography variant="h4" style={{backgroundColor: '#812aa4', color: 'white', padding: '10px'}}>
                Weather application
            </Typography>
            <div style={{display: "flex", width: "100%", justifyContent: "space-evenly", marginTop: "30px"}}>
                <div style={{
                    marginTop: "40px",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column"
                }}>
                    Current temperature
                    <h1>{currentTemperature} ºC</h1>
                </div>
                <div style={{
                    marginTop: "40px",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column"
                }}>
                    Average daily temperature
                    <h1>{averageTemperature} ºC</h1>
                </div>
                <div style={{
                    marginTop: "40px",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column"
                }}>
                    Current humidity
                    <h1>{currentHumidity} %</h1>
                </div>
                <div style={{
                    marginTop: "40px",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column"
                }}>
                    Average daily humidity
                    <h1>{averageHumidity} %</h1>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "row", justifyContent: 'space-evenly', marginTop: "80px"}}>
                <div style={{width: "38%"}}>
                    <CanvasJSChart options={options2}/>
                </div>
                <div style={{width: "38%"}}>
                    <CanvasJSChart options={options}/>
                </div>
            </div>
        </div>
    );

};

export default MainPage;