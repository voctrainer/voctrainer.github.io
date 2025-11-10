const fs = require('fs');
const path = require('path');

class FolderStructureGenerator {
    constructor() {
        this.baseDir = './abc';
    }

    generateStructure() {
        console.log('🚀 Creating folder structure for Orthodox liturgical music...');
        
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }

        const structure = {
            'vespers': {
                name: 'Вечерня',
                description: 'Первая служба суточного круга, совершаемая в вечернее время. Включает псалмы, стихиры, прокимны и другие песнопения.',
                showInNavigation: true,
                subfolders: {
                    'opening_psalms': { name: 'Начальные псалмы', description: 'Псалмы, с которых начинается вечерня', showInNavigation: true },
                    'kathismas': { name: 'Кафизмы', description: 'Разделы Псалтири, читаемые на вечерне', showInNavigation: false },
                    'stichera_lord_i_call': { name: 'Стихиры на Господи воззвах', description: 'Стихиры, исполняемые на стихирах вечерни', showInNavigation: false },
                    'vouchsafe_o_lord': { name: 'Сподоби, Господи', description: 'Сподоби, Господи, в вечер сей без греха сохранитися нам', showInNavigation: true },
                    'ektene': { name: 'Ектения на литии', description: 'Ектения на литии', showInNavigation: true },
                    'stichera_stichera': { name: 'Стихиры на стиховне', description: 'Стихиры, исполняемые в конце вечерни', showInNavigation: false },
                    'prokeimenons': { name: 'Прокимны вечерни', description: 'Прокимны на вечерне. Стихи из Псалтири, предваряющие чтения паремий на вечерне', showInNavigation: true },
                    'dismissal_troparia': { name: 'Отпустительные тропари', description: 'Тропари, исполняемые в конце службы', showInNavigation: false }
                }
            },
            'matins': {
                name: 'Утреня',
                description: 'Утреннее богослужение, включающее шестопсалмие, каноны, полиелей и великое славословие.',
                showInNavigation: true,
                subfolders: {
                    'hexapsalm': { name: 'Шестопсалмие', description: 'Шесть псалмов, читаемых в начале утрени', showInNavigation: false },
                    'polyeleos': { name: 'Полиелей', description: 'Торжественная часть утрени с пением хвалебных псалмов', showInNavigation: true },
                    'kathismas': { name: 'Кафизмы', description: 'Разделы Псалтири, читаемые на утрене', showInNavigation: false },
                    'sedalny': { name: 'Седальны', description: 'Песнопения, во время которых разрешается сидеть', showInNavigation: false },
                    'prokeimenons': { name: 'Прокимны утрени', description: 'Стихи из Псалтири, предваряющие чтения Евангелия', showInNavigation: true },
                    'canons': {
                        name: 'Каноны',
                        description: 'Циклы песнопений, посвященные празднику или святому',
                        showInNavigation: true,
                        subfolders: {
                            'irmosy': { name: 'Ирмосы', description: 'Первые песни канонов, задающие мелодический образец', showInNavigation: true },
                            'troparia': { name: 'Тропари', description: 'Последующие песни канонов', showInNavigation: false }
                        }
                    },
                    'great_doxology': { name: 'Великое славословие', description: 'Торжественное песнопение в конце утрени', showInNavigation: true },
                    'dismissal_troparia': { name: 'Отпустительные тропари', description: 'Тропари, исполняемые в конце службы', showInNavigation: true }
                }
            },
            'hours': {
                name: 'Часы',
                description: 'Краткие богослужения, совершаемые в определенное время суток.',
                showInNavigation: false,
                subfolders: {
                    'first_hour': { name: 'Первый час', description: 'Служба, совершаемая около 7 часов утра', showInNavigation: false },
                    'third_hour': { name: 'Третий час', description: 'Служба, совершаемая около 9 часов утра', showInNavigation: false },
                    'sixth_hour': { name: 'Шестой час', description: 'Служба, совершаемая около 12 часов дня', showInNavigation: false },
                    'ninth_hour': { name: 'Девятый час', description: 'Служба, совершаемая около 15 часов дня', showInNavigation: false }
                }
            },
            'liturgy': {
                name: 'Литургия',
                description: 'Главное христианское богослужение, во время которого совершается таинство Евхаристии.',
                showInNavigation: true,
                subfolders: {
                    'liturgy_of_the_catechumens': {
                        name: 'Литургия оглашенных',
                        description: 'Часть литургии, на которой могут присутствовать оглашенные.',
                        showInNavigation: true,
                        subfolders: {
                            'sinaptai': { 
                                name: 'Ектении', 
                                description: 'Молитвенные прошения на богослужении', 
                                showInNavigation: true,
                                subfolders: {
                                    'great_litany': { name: 'Великая ектения', description: 'Великая ектения начинается словами «Миром Господу помолимся». Великая ектения состоит из 12 прошений или отделов.', showInNavigation: true },
                                    'ektene_of_supplication': { name: 'Сугубая ектения', description: 'Сугубая ектения получила свое название как от двукратного [«усугублённого»] обращения в начале ектении к милосердию Божию о помиловании, так и от троекратного пения молитвы «Господи, помилуй»', showInNavigation: true },
                                    'petitioning_ektene': { name: 'Просительная ектения', description: 'В просительной ектении прошения заканчиваются пением «Подай, Господи» и малая – состоит только из трех прошений и начинается словами «Паки и паки…» (т.е. «снова и снова»).', showInNavigation: true },
                                    'litany_of_the_departed': { name: 'Заупокойная ектения', description: 'Ектения об усопших', showInNavigation: true },
                                    'little_litany': { name: 'Малая ектения', description: 'Великая ектения начинается словами «Миром Господу помолимся». Великая ектения состоит из 12 прошений или отделов.', showInNavigation: true }
                                }
                            },
                            'antiphons': { name: 'Антифоны', description: 'Псалмы или песнопения, исполняемые попеременно двумя хорами', showInNavigation: true },
                            'the_only-begotten_son': { name: 'Единородный Сыне', description: 'Неизменяемый православный гимн, входящий в состав второго антифона литургий Иоанна Златоуста и Василия Великого. Описывает воплощение и Божественную и Человеческую природы Иисуса Христа.', showInNavigation: true },
                            'third_antiphon': { name: 'Блаженны', description: 'Тропари, исполняемые на третьем антифоне', showInNavigation: true },
                            'little_entrance': { name: 'Малый вход', description: 'Торжественный вход с Евангелием', showInNavigation: true },
                            'trisagion': { name: 'Трисвятое', description: 'Песнопение "Святый Боже, Святый Крепкий, Святый Бессмертный"', showInNavigation: true },
                            'prokeimenons_alleluia': { name: 'Прокимны и аллилуарии', description: 'Стихи, предваряющие чтение Апостола и Евангелия', showInNavigation: true },
                            'epistle_gospel_readings': { name: 'Чтение Апостола и Евангелия', description: 'Чтения из Нового Завета', showInNavigation: false }
                        }
                    },
                    'liturgy_of_the_faithful': {
                        name: 'Литургия верных',
                        description: 'Центральная часть Литургии, во время которой совершается преложение Святых Даров',
                        showInNavigation: true,
                        subfolders: {
                            'cherubic_hymn': { name: 'Херувимская песнь', description: 'Песнопение, исполняемое во время Великого входа', showInNavigation: true },
                            'mercy_of_peace': { name: 'Милость мира', description: 'Начало евхаристического канона', showInNavigation: true },
                            'it_is_meet': { name: 'Достойно есть', description: 'Песнопение в честь Божией Матери', showInNavigation: true },
                            'communion_hymn': { name: 'Задостойник', description: 'Песнопение, заменяющее "Достойно есть" в праздники', showInNavigation: true },
                            'our_father': { name: 'Отче наш', description: 'Молитва Господня', showInNavigation: true },
                            'communion_hymns': { name: 'Причастные стихи', description: 'Песнопения, исполняемые во время причащения', showInNavigation: true }
                        }
                    }
                }
            },
            'sacraments': {
                name: 'Требы',
                description: 'Богослужения, совершаемые по потребностям верующих.',
                showInNavigation: true,
                subfolders: {
                    'baptism': { name: 'Крещение', description: 'Таинство вхождения в Церковь', showInNavigation: true },
                    'wedding': { name: 'Венчание', description: 'Таинство бракосочетания', showInNavigation: true },
                    'unction': { name: 'Соборование', description: 'Таинство исцеления души и тела', showInNavigation: true },
                    'funeral': { name: 'Отпевание', description: 'Чин погребения усопших', showInNavigation: true }
                }
            },
            'special_services': {
                name: 'Особые службы',
                description: 'Богослужения, совершаемые в особые периоды церковного года.',
                showInNavigation: true,
                subfolders: {
                    'great_lent': { name: 'Великий пост', description: 'Службы великопостного периода', showInNavigation: true },
                    'paschal_services': { name: 'Пасхальные службы', description: 'Службы пасхального периода', showInNavigation: true },
                    'nativity_services': { name: 'Рождественские службы', description: 'Службы рождественского периода', showInNavigation: true },
                    'theotokos_feasts': { name: 'Богородичные праздники', description: 'Службы в честь Божией Матери', showInNavigation: true },
                    'episcopal_worship': { name: 'Архиерейское богослужение', description: 'Богослужение, совершаемое архиереем', showInNavigation: true }
                }
            }
        };

        this.createFolders(structure, this.baseDir);
        console.log('✅ Folder structure created successfully!');
    }

    createFolders(structure, currentPath) {
        for (const [folderKey, folderData] of Object.entries(structure)) {
            const folderPath = path.join(currentPath, folderKey);
            
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(`📁 Created: ${folderPath}`);
                
                // Создаем folder.index с параметром showInNavigation
                this.createFolderIndex(folderPath, folderData.name, folderData.description, folderData.showInNavigation);
            }
            
            // Рекурсивно создаем подпапки
            if (folderData.subfolders && Object.keys(folderData.subfolders).length > 0) {
                this.createFolders(folderData.subfolders, folderPath);
            }
        }
    }

    createFolderIndex(folderPath, russianName, description = 'Описание раздела будет добавлено позже.', showInNavigation = true) {
        const indexPath = path.join(folderPath, 'folder.index');
        
        const content = `# ${russianName}

showInNavigation: ${showInNavigation}

${description}`;
        
        fs.writeFileSync(indexPath, content, 'utf8');
        console.log(`   📄 Created folder.index: ${russianName} (showInNavigation: ${showInNavigation})`);
    }
}

// Запуск генерации
try {
    const generator = new FolderStructureGenerator();
    generator.generateStructure();
} catch (error) {
    console.error('❌ Error creating folder structure:', error);
    process.exit(1);
}