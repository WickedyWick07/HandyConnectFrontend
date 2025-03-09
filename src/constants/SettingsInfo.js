const LanguageandRegion = [
    {
        language: [{name: 'English', code: 'en'}, {name: 'Spanish', code: 'es'}, {name: 'French', code: 'fr'}, {name: 'German', code: 'de'}],
        timezones: [
            {name: 'GMT+1 - Central European Time', code: 'GMT+1'},
            {name: 'GMT+2 - Eastern European Time', code: 'GMT+2'},
            {name: 'GMT+3 - East Africa Time', code: 'GMT+3'},
            {name: 'GMT+4 - Gulf Standard Time', code: 'GMT+4'}
        ]
    }
]

const Appearance = [ 
    {
        theme: [{name: 'Light', code: 'light'}, {name: 'Dark', code: 'dark'}],
        font: [{name: 'Roboto', code: 'roboto'}, {name: 'Arial', code: 'arial'}, {name: 'Times New Roman', code: 'times-new-roman'}]
    }
]

export default { LanguageandRegion, Appearance }