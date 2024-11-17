// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Contracts {
    // Количество контактов внутри смарт-контракта
    uint public count = 0;

    // Структура, описывающая контакт
    struct Contact {
        uint id;
        string name;
        string phone;
    }

    // Конструктор контракта
    constructor() {
        createContact("Daniil Solopov", "+7 333 999 99 99");
        createContact("Daniil Solopov 2", "+7 333 999 99 99");
    }

    // Список контактов
    mapping(uint => Contact) public contacts;

    // Создание нового контакта
    function createContact(string memory _name, string memory _phone) public {
        count++;
        contacts[count] = Contact(count, _name, _phone);
    }

    // Обновление контакта
    function updateContact(uint contact_id, string memory _name, string memory _phone) public {
        contacts[contact_id] = Contact(contact_id, _name, _phone);
    }

    // Удаление существующего контакта
    function deleteContact(uint contact_id) public {
        delete contacts[contact_id];
    }
}
