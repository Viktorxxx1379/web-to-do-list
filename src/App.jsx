import React, { useState, useEffect } from 'react';
import './App.css';
import ToDoForm from "./Add";
import ToDo from "./apr";
import axios from 'axios';

const STORAGE_KEY = 'user_tasks_data';
const WEATHER_API_KEY = 'c7616da4b68205c2f3ae73df2c31d177';

function App() {
  const [currencyData, setCurrencyData] = useState({});
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [hasError, setHasError] = useState('');
  const [taskList, setTaskList] = useState([]);

  useEffect(() => {
    const loadExternalData = async () => {
      try {
        const currencyRequest = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        
        if (!currencyRequest.data?.Valute) {
          throw new Error('Не удалось получить курсы валют');
        }

        const dollarRate = currencyRequest.data.Valute.USD.Value.toFixed(2).replace('.', ',');
        const euroRate = currencyRequest.data.Valute.EUR.Value.toFixed(2).replace('.', ',');

        setCurrencyData({ dollar: dollarRate, euro: euroRate });

        navigator.geolocation.getCurrentPosition(async (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          const weatherRequest = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${userLat}&lon=${userLon}&appid=${WEATHER_API_KEY}`
          );

          if (!weatherRequest.data.main) {
            throw new Error('Данные о погоде отсутствуют');
          }

          setWeatherInfo(weatherRequest.data);
        });
      } catch (err) {
        console.error(err);
        setHasError('Не удалось загрузить данные');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadExternalData();
  }, []);

  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsedData = JSON.parse(savedTasks);
        if (Array.isArray(parsedData)) {
          setTaskList(parsedData);
        }
      } catch (err) {
        console.error(err.message);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskList));
    } catch (err) {
      console.error(err.message);
    }
  }, [taskList]);

  const createNewTask = (taskText) => {
    if (taskText?.trim()) {
      const newEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        text: taskText,
        completed: false
      };
      setTaskList([...taskList, newEntry]);
    }
  };

  const deleteTask = (taskId) => {
    setTaskList(taskList.filter(item => item.id !== taskId));
  };

  const toggleTaskStatus = (taskId) => {
    setTaskList(
      taskList.map(item =>
        item.id === taskId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  if (isDataLoading) return <div className="App"><p>Загрузка данных...</p></div>;
  if (hasError) return <div className="App"><p style={{ color: 'red' }}>{hasError}</p></div>;

  return (
    <div className="App">
      <div className="info-panel">
        <div className="currency-block">
          <div className="currency-item">Доллар США — {currencyData.dollar} ₽</div>
          <div className="currency-item">Евро — {currencyData.euro} ₽</div>
        </div>
        
        {weatherInfo && (
          <div className="weather-block">
            🌡️ {(weatherInfo.main.temp - 273.15).toFixed(1)}°C
          </div>
        )}
      </div>

      <header>
        <h1 className="tasks-title">Мои задачи: {taskList.length}</h1>
      </header>

      <ToDoForm addTask={createNewTask} />

      {taskList.map(task => (
        <ToDo
          key={task.id}
          todo={task}
          toggleTask={toggleTaskStatus}
          removeTask={deleteTask}
        />
      ))}
    </div>
  );
}

export default App;