import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ToDoForm from "./Add";
import ToDo from "./apr";
import axios from 'axios';

const STORAGE_KEY = 'user_tasks_data';

function App() {
  const [currencyData, setCurrencyData] = useState(null);
  const [weatherTemp, setWeatherTemp] = useState(null);
  const [moscowTime, setMoscowTime] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [taskList, setTaskList] = useState([]);

  // Смещение локального времени относительно московского (в миллисекундах)
  const timeOffsetRef = useRef(0);

  // Первоначальная загрузка данных из API
  useEffect(() => {
    const loadExternalData = async () => {
      // --- Курсы валют ---
      try {
        const currencyRes = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        if (currencyRes.data?.Valute) {
          const dollar = currencyRes.data.Valute.USD.Value.toFixed(2).replace('.', ',');
          const euro = currencyRes.data.Valute.EUR.Value.toFixed(2).replace('.', ',');
          setCurrencyData({ dollar, euro });
        }
      } catch (err) {
        console.warn('Не удалось загрузить курсы валют:', err.message);
      }

      // --- Погода в Краснодаре (Open-Meteo) ---
      try {
        const weatherRes = await axios.get(
          'https://api.open-meteo.com/v1/forecast?latitude=45.04&longitude=38.98&current_weather=true'
        );
        if (weatherRes.data?.current_weather?.temperature !== undefined) {
          setWeatherTemp(weatherRes.data.current_weather.temperature);
        }
      } catch (err) {
        console.warn('Не удалось загрузить погоду:', err.message);
      }

      // --- Московское время ---
      try {
        const timeRes = await axios.get('https://worldtimeapi.org/api/timezone/Europe/Moscow');
        if (timeRes.data?.datetime) {
          const mskDate = new Date(timeRes.data.datetime);
          // Вычисляем смещение: разница между московским временем и текущим локальным
          timeOffsetRef.current = mskDate.getTime() - Date.now();

          // Показываем время сразу
          const now = new Date(Date.now() + timeOffsetRef.current);
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          setMoscowTime(`${hours}:${minutes}:${seconds}`);
        }
      } catch (err) {
        console.warn('Не удалось загрузить время через API, использую локальное:', err.message);
        timeOffsetRef.current = 0;
        // Показываем локальное время
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        setMoscowTime(`${hours}:${minutes}:${seconds}`);
      }

      // Загрузка завершена
      setIsDataLoading(false);
    };

    loadExternalData();
  }, []);

  // Запуск интервала для обновления времени каждую секунду
  useEffect(() => {
    if (isDataLoading) return; // ждём окончания загрузки

    const updateTime = () => {
      const now = new Date(Date.now() + timeOffsetRef.current);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setMoscowTime(`${hours}:${minutes}:${seconds}`);
    };

    // Сразу обновляем время при старте интервала (на случай, если при загрузке оно ещё не установилось)
    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [isDataLoading]);

  // Восстановление задач из localStorage
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

  // Сохранение задач в localStorage
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

  if (isDataLoading) {
    return <div className="App"><p>Загрузка данных...</p></div>;
  }

  return (
    <div className="App">
      <div className="info-panel">
        {moscowTime && (
          <div className="info-block">
            🕐 Московское время: {moscowTime}
          </div>
        )}
        {currencyData && (
          <div className="info-block">
            <div>Доллар США — {currencyData.dollar} ₽</div>
            <div>Евро — {currencyData.euro} ₽</div>
          </div>
        )}
        {weatherTemp !== null && (
          <div className="info-block">
            🌡️ Краснодар: {weatherTemp}°C
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