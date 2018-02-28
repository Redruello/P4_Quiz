
const { colorize, log, biglog, errorlog } = require("./out");

const model = require("./model");

/**
 * Muestra la ayuda.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log('Comandos:');
    log('   h|help - Muestra esta ayuda.');
    log('   list - Listar los quizzes existentes.');
    log('   show <id> - Muestra la pregunta y la respuesta del quiz indicado.');
    log('   add - Añadir un nuevo quiz interactivamente.');
    log('   delete <id> - Borrar el quiz indicado.');
    log('   edit <id> - Editar el quiz indicado.');
    log('   test <id> - Probar el quiz indicado.');
    log('   p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log('   credits - Créditos.');
    log('   q|quit - Salir del programa.');
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {

    model.getAll().forEach((quiz, id) => {
        log(`[${colorize(id, 'magenta')}]: ${quiz.question}`);
    });

    rl.prompt();
};


/**
 * Muestra el quiz indicado en el parámetro: La pregunta y la respuesta.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch (error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};


/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 * 
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono. 
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {

    rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {

        rl.question(colorize('Introduzca la respuesta ', 'red'), answer => {

            model.add(question, answer);
            log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};


/**
 * Borra un quiz del modelo.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch (error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};


/**
 * Edita un quiz del modelo.
 * 
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono. 
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);

            rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer) }, 0);

                rl.question(colorize('Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            rl.question(colorize((`${quiz.question}? `), 'red'), answer => {
                log('Su respuesta es:');
                if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                    biglog('Correcta', 'green');
                    rl.prompt();
                } else biglog('Incorrecta', 'red');
                rl.prompt();
            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};


/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {

    let score = 0;

    let toBeResolved = [];

    model.getAll().forEach((quiz, id) => {
        toBeResolved.push(id);
    });

    const playOne = () => {

        if (toBeResolved.length == 0) {
            log('Ninguna pregunta restante. Fin del juego. Puntuación:');
            biglog(score, 'blue');
            rl.prompt();
        } else {

            let rand = parseInt(Math.random() * toBeResolved.length);

            const quiz = model.getByIndex(toBeResolved[rand]);

            rl.question(colorize((`${quiz.question}? `), 'red'), answer => {
                if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                    score++;
                    log(`CORRECTO - Número de aciertos: ${score}`);
                    toBeResolved.splice(rand, 1);
                    playOne();
                    rl.prompt();
                } else {
                    log('INCORRECTO');
                    log('Fin del juego. Puntuación:');
                    biglog(score, 'blue');
                    rl.prompt();
                }
            });
        }
    }
    playOne();
};


/**
 * Muestra los nombres de los autores de la práctica.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('ALVARO', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 * 
 * @param rl    Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};