// Hindi and Nepali reviewed by: [name] — native-speaker review pending
import type { Lang } from '../api/types'

export interface Strings {
  title: string
  langLabel: string
  alertBannerHeading: string
  usingLocation: string
  showingVillage: (name: string) => string
  change: string
  chooseVillage: string
  yourRiskNow: string
  why: string
  imSafe: string
  needHelp: string
  confirmationSafe: string
  confirmationHelp: string
  done: string
  nearestShelters: string
  directions: string
  capacity: string
  reportIncident: string
  kindFlooding: string
  kindLandslide: string
  kindRoadBlocked: string
  kindOther: string
  description: string
  addPhoto: string
  submit: string
  submitSuccess: string
  submitError: string
  emergency: string
  prototypeNotice: string
}

export const strings: Record<Lang, Strings> = {
  en: {
    title: 'TeestaGuard',
    langLabel: 'Language',
    alertBannerHeading: 'Active alert',
    usingLocation: 'Using your location',
    showingVillage: (name) => `Showing: ${name}`,
    change: 'Change',
    chooseVillage: 'Choose your village',
    yourRiskNow: 'Your risk now',
    why: 'Why',
    imSafe: "I'm safe",
    needHelp: 'I need help',
    confirmationSafe: 'Sent. Disaster teams can see this.',
    confirmationHelp: 'Sent. Disaster teams can see this.',
    done: 'Done',
    nearestShelters: 'Nearest shelters',
    directions: 'Directions',
    capacity: 'capacity',
    reportIncident: 'Report an incident',
    kindFlooding: 'Flooding',
    kindLandslide: 'Landslide',
    kindRoadBlocked: 'Road blocked',
    kindOther: 'Other',
    description: 'Description',
    addPhoto: 'Add photo',
    submit: 'Submit',
    submitSuccess: 'Report sent. Thank you.',
    submitError: 'Could not send report. Please try again.',
    emergency: 'Emergency: 112',
    prototypeNotice: 'Prototype · sample data',
  },
  hi: {
    title: 'TeestaGuard',
    langLabel: 'भाषा',
    alertBannerHeading: 'सक्रिय चेतावनी',
    usingLocation: 'आपका स्थान उपयोग हो रहा है',
    showingVillage: (name) => `दिखा रहे हैं: ${name}`,
    change: 'बदलें',
    chooseVillage: 'अपना गाँव चुनें',
    yourRiskNow: 'अभी आपका जोखिम',
    why: 'क्यों',
    imSafe: 'मैं सुरक्षित हूँ',
    needHelp: 'मुझे मदद चाहिए',
    confirmationSafe: 'भेज दिया गया। आपदा टीमें इसे देख सकती हैं।',
    confirmationHelp: 'भेज दिया गया। आपदा टीमें इसे देख सकती हैं।',
    done: 'हो गया',
    nearestShelters: 'नज़दीकी आश्रय',
    directions: 'दिशा-निर्देश',
    capacity: 'क्षमता',
    reportIncident: 'घटना की रिपोर्ट करें',
    kindFlooding: 'बाढ़',
    kindLandslide: 'भूस्खलन',
    kindRoadBlocked: 'सड़क अवरुद्ध',
    kindOther: 'अन्य',
    description: 'विवरण',
    addPhoto: 'फ़ोटो जोड़ें',
    submit: 'जमा करें',
    submitSuccess: 'रिपोर्ट भेज दी गई। धन्यवाद।',
    submitError: 'रिपोर्ट नहीं भेजी जा सकी। फिर से कोशिश करें।',
    emergency: 'आपातकालीन: 112',
    prototypeNotice: 'प्रोटोटाइप · नमूना डेटा',
  },
  ne: {
    title: 'TeestaGuard',
    langLabel: 'भाषा',
    alertBannerHeading: 'सक्रिय चेतावनी',
    usingLocation: 'तपाईंको स्थान प्रयोग गरिँदैछ',
    showingVillage: (name) => `देखाइँदैछ: ${name}`,
    change: 'बदल्नुहोस्',
    chooseVillage: 'आफ्नो गाउँ छान्नुहोस्',
    yourRiskNow: 'अहिले तपाईंको जोखिम',
    why: 'किन',
    imSafe: 'म सुरक्षित छु',
    needHelp: 'मलाई मद्दत चाहियो',
    confirmationSafe: 'पठाइयो। विपद् टोलीहरूले यो देख्न सक्छन्।',
    confirmationHelp: 'पठाइयो। विपद् टोलीहरूले यो देख्न सक्छन्।',
    done: 'भयो',
    nearestShelters: 'नजिकका आश्रयस्थलहरू',
    directions: 'दिशा निर्देश',
    capacity: 'क्षमता',
    reportIncident: 'घटना रिपोर्ट गर्नुहोस्',
    kindFlooding: 'बाढी',
    kindLandslide: 'पहिरो',
    kindRoadBlocked: 'सडक अवरुद्ध',
    kindOther: 'अन्य',
    description: 'विवरण',
    addPhoto: 'फोटो थप्नुहोस्',
    submit: 'पेश गर्नुहोस्',
    submitSuccess: 'रिपोर्ट पठाइयो। धन्यवाद।',
    submitError: 'रिपोर्ट पठाउन सकिएन। फेरि प्रयास गर्नुहोस्।',
    emergency: 'आपतकालीन: 112',
    prototypeNotice: 'प्रोटोटाइप · नमूना डेटा',
  },
}
