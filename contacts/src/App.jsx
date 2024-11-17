import { useEffect, useRef, useState } from 'react';
import Web3 from 'web3';
import styles from './App.module.css';
import { CONTACT_ABI, CONTACT_ADDRESS } from './config';
import DeleteIcon from './DeleteIcon/DeleteIcon';
import PencilIcon from './PencilIcon';

/**
 * Точка входа в React.js приложение
 * @returns 
 */
const App = () => {
  // Объект Web3, который будет использоваться для выполнения операций
  const web3Ref = useRef(null);

  // Переменная состояния аккаунта
  const [account, setAccount] = useState();

  // Контракт
  const [contract, setContract] = useState();

  // Список контактов
  const [contacts, setContacts] = useState([]);

  // Состояния для добавления контракта
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Обработчик изменения input'ов
  const changeHandler = (e) => {
    if (e.target.name === "name") {
      setName(e.target.value);
    } else if (e.target.name === "phone") {
      setPhone(e.target.value);
    }
  }

  /**
   * Отправка транзакции
   * @param {*} method Метод
   * @param {*} args Аргументы метода
   */
  const sendTransaction = async (method, args) => {
    try {
      // Вычисление Gas для отправки метода к аргументами
      const gasEstimation = await method(...args).estimateGas({ from: account });

      // Выполнение конкретного метода за определённый Gas
      const result = await method(...args).send({ from: account, gas: gasEstimation });
      console.log(result);
    } catch (err) {
      alert(err);
    }
  };

  // Идентификатор контакта, который будет изменён
  const [contactId, setContactId] = useState(0);

  // Обработчик изменения существующего контакта
  const updateHandler = async () => {
    if (name.length === 0 || phone.length === 0) {
      alert("Необходимо заполнить имя и телефон");
      return;
    }

    if (!contactId) {
      alert("Необходимо выбрать контакт для изменения");
      return;
    }

    // Отправка транзакции
    await sendTransaction(contract.methods.updateContact, [contactId, name, phone]);

    load(false);
    alert("Контакт успешно изменён!");

    setContactId(0);
    setName("");
    setPhone("");
  }

  // Обработчик добавления нового контакта
  const addHandler = async () => {
    if (name.length === 0 || phone.length === 0) {
      alert("Необходимо заполнить имя и телефон");
      return;
    }

    // Отправка транзакции
    await sendTransaction(contract.methods.createContact, [name, phone]);

    load(false);
    alert("Контакт успешно добавлен!");
  }

  /**
   * Удаление контакта из смарт-контракта
   * @param {bigint} contact_id Идентификатор контакта
   */
  const deleteHandler = async (contact_id) => {
    // Отправка транзакции
    await sendTransaction(contract.methods.deleteContact, [contact_id]);

    load(false);
    alert("Контакт успешно удалён!");
  }

  /**
   * Создание объекта Web3 для работы с MetaMask
   * @returns 
   */
  const initWeb3 = () => {
    if (!window.ethereum) {
      alert("Отсутствует поддержка MetaMask");
      return false;
    }

    web3Ref.current = new Web3(window.ethereum);
    return true;
  }

  /**
   * Инициация подключения к MetaMask
   */
  const signUpMetaMask = async () => {
    if (!window.ethereum) {
      alert("Отсутствует поддержка MetaMask");
      return;
    }

    const permissions = await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [
        {
          eth_accounts: {},
        },
      ],
    });

    localStorage.setItem("sign_up_test_net", JSON.stringify({
      success: true
    }));
  }

  /**
   * Загрузка данных из аккаунта
   * @param {boolean} signUpCheck Проверять ли пользователя на регистрацию в MetaMask
   */
  const load = async (signUpCheck = true) => {
    // Проверка авторизации пользователя в MetaMask
    if (signUpCheck) {
      // Значение из локального хранилища, указывая что мы авторизовались в MetaMask
      const item = localStorage.getItem("sign_up_test_net");

      if (!item || !JSON.parse(item).success) {
        await signUpMetaMask();
      }
    }

    // Получение информации об аккаунте, к котомору было осуществлено подключение
    const accounts = await web3Ref.current.eth.requestAccounts();
    setAccount(accounts[0]);

    const localContract = new web3Ref.current.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS);
    setContract(localContract);

    // Вызов функции из контракта для получения количества контактов
    const counter = await localContract.methods.count().call();
    const contactsResult = [];

    for (let i = counter; i >= 0; i--) {
      // Получении информации о конкретном контакте
      const contact = await localContract.methods.contacts(i).call();
      contactsResult.push(contact);
    }

    // Добавление контактов
    setContacts(contactsResult);
  };

  useEffect(() => {
    if (initWeb3()) {
      // Загружаем данные из аккаунта только тогда, когда есть доступ к MetaMask
      load();
    }
  }, []);

  const changeAccount = () => {
    signUpMetaMask();
  };

  return (
    <div className={styles.block}>
      <div>Ваш аккаунт: {account}</div>
      <div>Текущий контракт: {CONTACT_ADDRESS}</div>
      <div>
        <button style={{ marginTop: '12px' }} onClick={changeAccount}>Изменить аккаунт</button>
      </div>

      <div className={styles.row}>
        <div>
          <h1>Контакты </h1>
          <ul>
            {
              Object.keys(contacts).map((contact, index) => {
                const item = contacts[contact];
                if (item.id == 0n) {
                  return <></>;
                }

                return (
                  <li key={contact} className={styles.info}>
                    <div className={styles.rowText}>
                      <span><b>ID: </b>{String(item.id)}</span>
                      <div className={styles.rowText} style={{ gap: '4px' }}>
                        <PencilIcon
                          width={16}
                          height={16}
                          clickHandler={() => {
                            setContactId(item.id);
                            setName(item.name);
                            setPhone(item.phone);
                          }}
                        />
                        <DeleteIcon
                          width={16}
                          height={16}
                          color={'red'}
                          clickHandler={() => {
                            deleteHandler(item.id);
                          }}
                        />
                      </div>
                    </div>
                    <div><span><b>Имя: </b>{item.name}</span></div>
                    <div><span><b>Номер: </b>{item.phone}</span></div>
                  </li>
                );
              })
            }
          </ul>
        </div>
        <div>
          {
            !contactId ? <h1>Добавление нового контакта: </h1> : <h1>Изменение контакта: </h1>
          }
          {
            (contactId && contactId > 0) && <div className={styles.element}>
              <p>ID: {String(contactId)}</p>
            </div> || <></>
          }
          <div className={styles.element}>
            <p>Имя: </p>
            <input name="name" onChange={changeHandler} value={name} />
          </div>
          <div className={styles.element}>
            <p>Номер: </p>
            <input name="phone" onChange={changeHandler} value={phone} />
          </div>
          <div className={styles.element} style={{ marginTop: '12px' }}>
            {
              !contactId ? <button onClick={addHandler}>Добавить контакт</button>
                : <button onClick={updateHandler}>Изменить контакт</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
