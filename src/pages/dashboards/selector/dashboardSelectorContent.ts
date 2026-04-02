import {
  ArrowRight,
  BookOpenText,
  GraduationCap,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardKind } from '../../../shared/config';
import type { Locale } from '../../../shared/i18n/config';

export type DashboardSelectorCard = {
  kind: DashboardKind;
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  cta: string;
};

type SelectorCopy = {
  brandTitle: string;
  brandSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  contextTitle: string;
  contextPoints: string[];
  footerHint: string;
  loadingTitle: string;
  loadingDescription: string;
  redirectingTitle: string;
  redirectingDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  logoutLabel: string;
  cards: Record<
    DashboardKind,
    {
      title: string;
      description: string;
      badge: string;
      cta: string;
    }
  >;
};

const DASHBOARD_ORDER: DashboardKind[] = ['admin', 'teacher', 'student'];

const DASHBOARD_VISUALS: Record<
  DashboardKind,
  { href: string; icon: LucideIcon }
> = {
  admin: {
    href: '/dashboards/admin',
    icon: Settings,
  },
  teacher: {
    href: '/dashboards/teacher',
    icon: BookOpenText,
  },
  student: {
    href: '/dashboards/student',
    icon: GraduationCap,
  },
};

const SELECTOR_COPY: Record<Locale, SelectorCopy> = {
  en: {
    brandTitle: 'InterHub',
    brandSubtitle: 'A bilingual academic space for studying in China',
    heroTitle: 'Choose your role in the Chinese academic environment',
    heroDescription:
      'InterHub helps international students, teachers, and coordinators move through Chinese university life with one clear digital workspace.',
    contextTitle: 'Why this presentation fits Han studies',
    contextPoints: [
      'The platform is tied to the everyday structure of study at a Chinese university.',
      'Schedules, lessons, requests, and subjects are unified into one academic route.',
      'The bilingual interface lowers the barrier between international users and the local campus system.',
    ],
    footerHint:
      'Each dashboard keeps the same study flow while adapting the interface to your role in the university system.',
    loadingTitle: 'Preparing your workspace',
    loadingDescription:
      'Checking your roles and available dashboards before opening the right view.',
    redirectingTitle: 'Opening your default dashboard',
    redirectingDescription:
      'Only one dashboard is available for this account, so we are taking you there automatically.',
    emptyTitle: 'No dashboards available',
    emptyDescription:
      'Your account does not have access to any dashboard yet. Please contact an administrator if this looks incorrect.',
    logoutLabel: 'Sign out',
    cards: {
      admin: {
        title: 'Administrator dashboard',
        description:
          'Coordinate academic structure, invitations, and campus operations for students studying in China.',
        badge: 'Campus operations',
        cta: 'Open dashboard',
      },
      teacher: {
        title: 'Teacher dashboard',
        description:
          'Work with lessons, schedules, student groups, and requests inside a bilingual teaching workflow.',
        badge: 'Teaching',
        cta: 'Open dashboard',
      },
      student: {
        title: 'Student dashboard',
        description:
          'Follow classes, subjects, and requests in one clear route through university life in China.',
        badge: 'Study route',
        cta: 'Open dashboard',
      },
    },
  },
  ru: {
    brandTitle: 'InterHub',
    brandSubtitle: 'Двуязычное академическое пространство для учебы в Китае',
    heroTitle: 'Выберите свою роль в китайской академической среде',
    heroDescription:
      'InterHub помогает иностранным студентам, преподавателям и координаторам уверенно двигаться по учебной жизни китайского университета через одно понятное цифровое пространство.',
    contextTitle: 'Почему такая подача подходит теме 汉学',
    contextPoints: [
      'Платформа опирается на реальную структуру учебы внутри китайского университета.',
      'Расписание, занятия, обращения и предметы собраны в один академический маршрут.',
      'Двуязычный интерфейс снижает барьер между иностранным пользователем и локальной кампусной системой.',
    ],
    footerHint:
      'Каждый кабинет сохраняет общую учебную логику, но адаптирует интерфейс под вашу роль в университетской системе.',
    loadingTitle: 'Подготавливаем рабочее пространство',
    loadingDescription:
      'Проверяем ваши роли и доступные кабинеты перед открытием нужного раздела.',
    redirectingTitle: 'Открываем кабинет по умолчанию',
    redirectingDescription:
      'Для этой учётной записи доступен только один кабинет, поэтому мы сразу переводим вас в него.',
    emptyTitle: 'Нет доступных кабинетов',
    emptyDescription:
      'Для вашей учётной записи пока не настроен доступ ни к одному кабинету. Если это выглядит как ошибка, обратитесь к администратору.',
    logoutLabel: 'Выйти',
    cards: {
      admin: {
        title: 'Кабинет администратора',
        description:
          'Управляйте академической структурой, приглашениями и университетскими процессами для студентов, обучающихся в Китае.',
        badge: 'Кампусное управление',
        cta: 'Открыть кабинет',
      },
      teacher: {
        title: 'Кабинет преподавателя',
        description:
          'Работайте с занятиями, расписанием, учебными группами и обращениями в двуязычном преподавательском контуре.',
        badge: 'Преподавание',
        cta: 'Открыть кабинет',
      },
      student: {
        title: 'Кабинет студента',
        description:
          'Следите за занятиями, предметами и заявками как за единым учебным маршрутом внутри жизни китайского кампуса.',
        badge: 'Учебный маршрут',
        cta: 'Открыть кабинет',
      },
    },
  },
  'zh-Hans': {
    brandTitle: 'InterHub',
    brandSubtitle: '面向在中国学习场景的双语学术空间',
    heroTitle: '选择你在中国学术环境中的角色',
    heroDescription:
      'InterHub 让国际学生、教师与协调人员在中国大学的学习生活中，通过一个清晰的数字空间完成日常学术流程。',
    contextTitle: '为什么这样的呈现适合汉学主题',
    contextPoints: [
      '平台围绕中国高校真实的学习结构展开，而不是通用门户模板。',
      '课表、课程、申请与科目被整合为一条连贯的学术路径。',
      '双语界面降低了国际用户进入本地校园系统的门槛。',
    ],
    footerHint: '每个仪表盘都保留统一的学习流程，同时根据你在高校系统中的角色调整界面重点。',
    loadingTitle: '正在准备工作区',
    loadingDescription: '系统正在检查你的角色与可访问的仪表盘。',
    redirectingTitle: '正在打开默认仪表盘',
    redirectingDescription: '当前账号只可访问一个仪表盘，系统将自动跳转。',
    emptyTitle: '暂无可用仪表盘',
    emptyDescription:
      '当前账号暂时没有任何仪表盘访问权限。如果这与预期不符，请联系管理员。',
    logoutLabel: '退出登录',
    cards: {
      admin: {
        title: '管理员仪表盘',
        description:
          '协调学术结构、邀请与校园流程，服务于在中国学习的学生群体。',
        badge: '校园运营',
        cta: '打开仪表盘',
      },
      teacher: {
        title: '教师仪表盘',
        description:
          '在双语教学流程中处理课程、课表、学生小组与请假申请。',
        badge: '教学',
        cta: '打开仪表盘',
      },
      student: {
        title: '学生仪表盘',
        description:
          '把课程、科目与申请整合为一条清晰的在华大学学习路径。',
        badge: '学习路径',
        cta: '打开仪表盘',
      },
    },
  },
};

export const DASHBOARD_SELECTOR_CTA_ICON = ArrowRight;

export function getDashboardSelectorCopy(locale: Locale): SelectorCopy {
  return SELECTOR_COPY[locale] ?? SELECTOR_COPY.en;
}

export function getDashboardSelectorCards(
  locale: Locale,
  dashboards: DashboardKind[]
): DashboardSelectorCard[] {
  const copy = getDashboardSelectorCopy(locale);

  return DASHBOARD_ORDER.filter((kind) => dashboards.includes(kind)).map((kind) => ({
    kind,
    ...DASHBOARD_VISUALS[kind],
    ...copy.cards[kind],
  }));
}
