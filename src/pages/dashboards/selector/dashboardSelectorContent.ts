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
    brandSubtitle: 'Dalian Neusoft University of Information',
    heroTitle: 'Choose dashboard',
    heroDescription:
      'Select your working area to access the relevant tools and information.',
    footerHint:
      'Your access level determines which dashboards are available to you.',
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
          'Manage academic structure, user access, invitations, and platform settings.',
        badge: 'Operations',
        cta: 'Open dashboard',
      },
      teacher: {
        title: 'Teacher dashboard',
        description:
          'Work with schedule, subjects, lessons, student groups, and absence requests.',
        badge: 'Teaching',
        cta: 'Open dashboard',
      },
      student: {
        title: 'Student dashboard',
        description:
          'Review schedule, lessons, subjects, requests, and your personal profile.',
        badge: 'Learning',
        cta: 'Open dashboard',
      },
    },
  },
  ru: {
    brandTitle: 'InterHub',
    brandSubtitle: 'Даляньский университет Neusoft',
    heroTitle: 'Выберите дашборд',
    heroDescription:
      'Выберите рабочую область, чтобы открыть нужные инструменты и данные.',
    footerHint:
      'Набор доступных дашбордов зависит от ролей вашей учетной записи.',
    loadingTitle: 'Подготавливаем рабочее пространство',
    loadingDescription:
      'Проверяем ваши роли и доступные дашборды перед открытием нужного раздела.',
    redirectingTitle: 'Открываем дашборд по умолчанию',
    redirectingDescription:
      'Для этой учетной записи доступен только один дашборд, поэтому мы сразу перенаправляем вас туда.',
    emptyTitle: 'Нет доступных дашбордов',
    emptyDescription:
      'Для вашей учетной записи пока не настроен доступ ни к одному дашборду. Если это ошибка, обратитесь к администратору.',
    logoutLabel: 'Выйти',
    cards: {
      admin: {
        title: 'Дашборд администратора',
        description:
          'Управление академической структурой, доступами пользователей, приглашениями и настройками системы.',
        badge: 'Управление',
        cta: 'Открыть дашборд',
      },
      teacher: {
        title: 'Дашборд преподавателя',
        description:
          'Работа с расписанием, предметами, занятиями, учебными группами и запросами на пропуск.',
        badge: 'Преподавание',
        cta: 'Открыть дашборд',
      },
      student: {
        title: 'Дашборд студента',
        description:
          'Просмотр расписания, занятий, предметов, заявок и личного профиля.',
        badge: 'Обучение',
        cta: 'Открыть дашборд',
      },
    },
  },
  'zh-Hans': {
    brandTitle: 'InterHub',
    brandSubtitle: '大连东软信息学院',
    heroTitle: '选择仪表盘',
    heroDescription: '选择你的工作区域以进入相应的工具和信息。',
    footerHint: '你当前账号可见的仪表盘取决于所分配的角色。',
    loadingTitle: '正在准备工作区',
    loadingDescription: '系统正在检查你的角色和可访问的仪表盘。',
    redirectingTitle: '正在打开默认仪表盘',
    redirectingDescription: '当前账号只可访问一个仪表盘，系统将自动跳转。',
    emptyTitle: '没有可用的仪表盘',
    emptyDescription:
      '当前账号暂时没有任何仪表盘访问权限。如果这不符合预期，请联系管理员。',
    logoutLabel: '退出登录',
    cards: {
      admin: {
        title: '管理员仪表盘',
        description: '管理学术结构、用户权限、邀请与系统设置。',
        badge: '管理',
        cta: '打开仪表盘',
      },
      teacher: {
        title: '教师仪表盘',
        description: '处理课表、科目、课程、小组以及请假申请。',
        badge: '教学',
        cta: '打开仪表盘',
      },
      student: {
        title: '学生仪表盘',
        description: '查看课表、课程、科目、申请以及个人资料。',
        badge: '学习',
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
