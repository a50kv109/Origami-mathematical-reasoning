/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckSquare,
  ExternalLink,
  FileText,
  Menu,
  Square,
  X,
} from 'lucide-react';
import {
  ARCHITECTURE_LAYERS,
  CONTRACTS,
  CORE_CONCEPTS,
  EPISTEMIC_PILLARS,
  IDENTITY_CLASSES,
  REPOSITORY_TREE,
  REUSE_AUDIT_ITEMS,
  ROADMAP_PHASES,
  SOURCES_29,
  STAGE_ONE_DOCS,
  SUBSEQUENT_CONTRACTS,
  SUCCESS_CRITERIA,
  SYSTEM_CONTOURS,
  TOOL_ADAPTERS,
  type SourceCategory,
} from './data/passportData';
import {
  VerificationWorkbench,
  type FoldStage,
  type TestCaseId,
} from './components/VerificationWorkbench';

interface NavItem {
  id: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Обзор', href: '#overview' },
  { id: 'architecture', label: 'Архитектура', href: '#architecture' },
  { id: 'sources', label: 'Источники', href: '#sources' },
  { id: 'verification', label: 'Прототип', href: '#verification' },
  { id: 'roadmap', label: 'Документы', href: '#roadmap' },
];

interface HeaderProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onRunVerification: () => void;
}

export function Header({
  activeSection,
  onNavigate,
  onRunVerification,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigate(sectionId);
  };

  const handleActionClick = () => {
    setMobileMenuOpen(false);
    onRunVerification();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Logo Placeholder */}
        <a
          href="#overview"
          onClick={() => handleLinkClick('overview')}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-900"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="4 4 20 4 12 20 4 4" />
              <line x1="12" y1="4" x2="12" y2="20" />
              <line x1="4" y1="4" x2="20" y2="12" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
            OMR · v0.1.0
          </span>
        </a>

        {/* Zone 2: Desktop Navigation Menu */}
        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => handleLinkClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded-sm ${
                  isActive
                    ? 'text-slate-900 underline decoration-blue-600 decoration-2 underline-offset-8'
                    : 'text-slate-600 hover:text-slate-900 hover:underline hover:decoration-slate-300 hover:underline-offset-8'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Mobile Menu Toggle */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleActionClick}
            className="hidden md:inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
          >
            Проверка L2→L7
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Мобильная навигация"
          className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={() => handleLinkClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleActionClick}
              className="flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
            >
              Проверка L2→L7
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

type SourceFilter = 'all' | 'top14' | SourceCategory;

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedLayerCode, setSelectedLayerCode] = useState<string>('L2');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('top14');
  const [layerFilter, setLayerFilter] = useState<string>('ALL');
  const [foldStage, setFoldStage] = useState<FoldStage>('initial');
  const [testCase, setTestCase] = useState<TestCaseId>('T-01');
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [checkedCriteria, setCheckedCriteria] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
  });

  const selectedLayer =
    ARCHITECTURE_LAYERS.find((layer) => layer.code === selectedLayerCode) ??
    ARCHITECTURE_LAYERS[0];

  const selectedDoc = STAGE_ONE_DOCS[selectedDocIndex] ?? STAGE_ONE_DOCS[0];

  const filteredSources = useMemo(() => {
    return SOURCES_29.filter((src) => {
      if (sourceFilter === 'top14' && !src.isTop14) return false;
      if (
        sourceFilter !== 'all' &&
        sourceFilter !== 'top14' &&
        src.category !== sourceFilter
      ) {
        return false;
      }
      if (layerFilter !== 'ALL' && !src.layers.includes(layerFilter)) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sourceFilter === 'top14') {
        return (a.top14Rank ?? 99) - (b.top14Rank ?? 99);
      }
      return a.id - b.id;
    });
  }, [sourceFilter, layerFilter]);

  const navigateTo = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRunVerification = () => {
    setTestCase('T-01');
    setFoldStage('reflected');
    navigateTo('verification');
  };

  const toggleCriterion = (index: number) => {
    setCheckedCriteria((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        activeSection={activeSection}
        onNavigate={navigateTo}
        onRunVerification={handleRunVerification}
      />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* 1. Overview & Project Initiation */}
        <section
          id="overview"
          className="scroll-mt-24 border-b border-slate-200 pb-14"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-slate-500">
              Origami Mathematical Reasoning (OMR) · v0.1.0 · Phase 2.1 (Verified 2D Reflection Prototype)
            </p>
            <h1 className="mt-3 max-w-2xl text-balance font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Математическое ядро и Zero-Trust верификация
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
              Реализованный контур Contract 02 v2 (L2 → ReflectionWitness → TRACE
              → L7) для 2D-отражений (13/13 автотестов PASS), архитектура L1–L7
              и реестр 29 источников. Версия v0.1.0 не является системой
              физического складывания оригами; L1, L3–L6 и адаптеры запланированы
              на следующие фазы.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleRunVerification}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
              >
                <span>Прототип L2 → L7</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <a
                href="#sources"
                onClick={() => setActiveSection('sources')}
                className="inline-flex items-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Реестр 29 источников
              </a>
            </div>
          </div>

          {/* Three System Contours: Core / Design Tools / AI Skill */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Три разделённых контура системы
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
              {SYSTEM_CONTOURS.map((contour) => (
                <article
                  key={contour.code}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-blue-700">
                      Контур {contour.code}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                      {contour.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-700">{contour.role}</p>
                  </div>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
                    {contour.boundary}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* Three-part Epistemic Separation */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {EPISTEMIC_PILLARS.map((pillar) => (
              <article
                key={pillar.index}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <p className="font-mono text-xs text-slate-500">
                  {pillar.index}. {pillar.subtitle}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  {pillar.title}
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
                  {pillar.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {/* Five Fundamental Core Concepts */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Пять фундаментальных понятий ядра
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CORE_CONCEPTS.map((concept) => (
                <div
                  key={concept.term}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="font-mono text-xs font-semibold text-blue-700">
                    {concept.term}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-900">
                    {concept.role}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {concept.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Architecture Layers L1-L7, Contracts & Tool Integration Layer */}
        <section
          id="architecture"
          className="scroll-mt-24 border-b border-slate-200 py-14"
        >
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Семислойная архитектура, контракты и адаптеры инструментов
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Изоляция уровней L1–L7 без слияния в единый кортеж и отдельный Tool
              Integration Layer без предположений о неподтверждённых API.
            </p>
          </div>

          {/* Interactive Layer Selector + Inspector */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-6">
              <div className="divide-y divide-slate-200">
                {ARCHITECTURE_LAYERS.map((layer) => {
                  const isSelected = layer.code === selectedLayer.code;
                  return (
                    <button
                      key={layer.code}
                      type="button"
                      onClick={() => setSelectedLayerCode(layer.code)}
                      className={`flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-baseline gap-3">
                        <span
                          className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                            isSelected ? 'text-blue-300' : 'text-blue-700'
                          }`}
                        >
                          {layer.code}
                        </span>
                        <span className="truncate text-sm font-semibold">
                          {layer.name}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 text-xs ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {layer.maturity}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <span className="font-mono text-xs font-semibold text-blue-700">
                    {selectedLayer.code} · {selectedLayer.space}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {selectedLayer.maturity}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {selectedLayer.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedLayer.purpose}
                </p>

                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-900">
                    Ответственность
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                    {selectedLayer.responsibilities.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="text-slate-400">
                          ·
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-900">
                    Ключевые операции
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-slate-700">
                    {selectedLayer.operations.join(' · ')}
                  </p>
                </div>

                {selectedLayer.constraint && (
                  <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700">
                    {selectedLayer.constraint}
                  </div>
                )}
              </div>

              <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
                {selectedLayer.devNote}
              </p>
            </div>
          </div>

          {/* Inter-Module Contracts */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              Межмодульные контракты
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              {CONTRACTS.map((contract) => (
                <article
                  key={contract.id}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <p className="font-mono text-xs text-blue-700">
                    {contract.id} · {contract.pair}
                  </p>
                  <h4 className="mt-1.5 text-lg font-semibold text-slate-900">
                    {contract.subject}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Целевой сценарий: {contract.targetScenario}
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                    {contract.topics.map((topic) => (
                      <li key={topic} className="flex gap-2">
                        <span aria-hidden="true" className="text-slate-400">
                          ·
                        </span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-700">
                    {contract.status}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Последующие контракты (формализация запланирована):{' '}
              {SUBSEQUENT_CONTRACTS.join(' · ')}
            </p>
          </div>

          {/* Tool Integration Layer */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              Tool Integration Layer (внешние программы оригами)
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Единый контракт ToolAdapter транслирует канонические операции во
              внешние инструменты и направляет ответ обратно на Zero-Trust
              проверку в L7.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {TOOL_ADAPTERS.map((tool) => (
                <article
                  key={tool.name}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-semibold text-slate-900">
                      {tool.name}
                    </h4>
                    <span className="font-mono text-xs text-slate-500">
                      {tool.stack}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-blue-700">
                    {tool.role}
                  </p>
                  <p className="mt-2.5 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">Подтверждено: </span>
                    {tool.confirmed}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    <span className="font-medium text-slate-700">Проверка API: </span>
                    {tool.unverifiedApi}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Source Registry (29/58), Reuse & Gap Audit, Modular Identity */}
        <section
          id="sources"
          className="scroll-mt-24 border-b border-slate-200 py-14"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Реестр источников (29 релевантных из 58) и аудит заимствований
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Каталог проверенных репозиториев, математической литературы и
                отчётов, распределённых по слоям L1–L7 и приоритету Top-14.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-600">
              Показано: {filteredSources.length} / {SOURCES_29.length}
            </span>
          </div>

          {/* Filter Controls */}
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: 'top14', label: 'Top-14 для старта' },
                  { key: 'all', label: 'Все 29' },
                  { key: 'Simulators & Datasets', label: 'Симуляторы и датасеты' },
                  { key: 'Stands & Verifiers', label: 'Стенды и верификаторы' },
                  { key: 'Literature (PDF)', label: 'Учебники (PDF)' },
                  { key: 'Specs & Reports', label: 'Отчёты OMR' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSourceFilter(tab.key)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    sourceFilter === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {['ALL', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'].map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => setLayerFilter(layer)}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors cursor-pointer ${
                    layerFilter === layer
                      ? 'bg-blue-700 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {layer === 'ALL' ? 'Все слои' : layer}
                </button>
              ))}
            </div>
          </div>

          {/* Filtered Source Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredSources.map((src) => (
              <article
                key={src.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
              >
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-500">
                    <span className="font-mono">
                      #{String(src.id).padStart(2, '0')} · {src.layers.join(' / ')}
                    </span>
                    <span>
                      {src.isTop14 ? `Top-14 (#${src.top14Rank})` : src.year}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">
                    {src.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {src.author} · {src.year}
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                    {src.summary}
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
                  {src.reference.startsWith('http') ? (
                    <a
                      href={src.reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:underline"
                    >
                      <span className="truncate max-w-xs sm:max-w-sm">
                        {src.reference.replace('https://', '')}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-slate-500">{src.reference}</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Reuse & Gap Audit */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              Результаты аудита переиспользования и выявленные пробелы
            </h3>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="divide-y divide-slate-200">
                {REUSE_AUDIT_ITEMS.map((item) => (
                  <div
                    key={item.module}
                    className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-12 sm:items-center sm:gap-6"
                  >
                    <div className="sm:col-span-4">
                      <p className="font-mono text-xs font-semibold text-slate-900">
                        {item.module}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.origin}</p>
                    </div>
                    <p className="text-sm text-slate-600 sm:col-span-6">
                      {item.detail}
                    </p>
                    <div className="sm:col-span-2 sm:text-right">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          item.status === 'GAP'
                            ? 'text-rose-700'
                            : item.status === 'REUSE'
                              ? 'text-emerald-700'
                              : 'text-blue-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modular Mathematical Identity */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              Модульная математическая идентичность (Class I–III)
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
              {IDENTITY_CLASSES.map((item) => (
                <article
                  key={item.code}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div>
                    <p className="font-mono text-xs text-slate-500">
                      {item.code} · {item.portability}
                    </p>
                    <h4 className="mt-2 text-base font-semibold text-slate-900">
                      {item.title}
                    </h4>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                      {item.examples.map((ex) => (
                        <li key={ex} className="flex gap-2">
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    {item.note}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 4. First Prototype Interactive Workbench */}
        <section
          id="verification"
          className="scroll-mt-24 border-b border-slate-200 py-14"
        >
          <VerificationWorkbench
            stage={foldStage}
            onStageChange={setFoldStage}
            testCase={testCase}
            onTestCaseChange={setTestCase}
          />
        </section>

        {/* 5. Stage 1 Docs, Repository Structure, Roadmap & Success Criteria */}
        <section id="roadmap" className="scroll-mt-24 pt-14">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Документация OMR v0.1.0, структура репозитория и план этапов
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Ключевые документы каталога docs/ синхронизированы с фактической
              реализацией Phase 2.1 (v0.1.0) и определяют переход к Phase 2.2 и
              Phase 3+.
            </p>
          </div>

          {/* Interactive Stage 1 Docs Explorer */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-5">
              <div className="divide-y divide-slate-200">
                {STAGE_ONE_DOCS.map((doc, idx) => {
                  const active = idx === selectedDocIndex;
                  return (
                    <button
                      key={doc.filename}
                      type="button"
                      onClick={() => setSelectedDocIndex(idx)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <FileText
                          className={`h-4 w-4 shrink-0 ${
                            active ? 'text-blue-300' : 'text-slate-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate font-mono text-xs font-medium">
                          {doc.title}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 font-mono text-[11px] tabular-nums ${
                          active ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}/
                        {String(STAGE_ONE_DOCS.length).padStart(2, '0')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
              <div>
                <p className="font-mono text-xs text-blue-700">
                  {selectedDoc.filename}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {selectedDoc.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {selectedDoc.scope}
                </p>
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-900">
                    Ключевые положения документа
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {selectedDoc.keyTakeaways.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span aria-hidden="true" className="text-slate-400">
                          ·
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="font-mono text-xs text-slate-500">
                  Фактическая структура репозитория Origami-mathematical-reasoning (v0.1.0)
                </p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3.5 font-mono text-xs leading-relaxed text-slate-700">
                  {REPOSITORY_TREE}
                </pre>
              </div>
            </div>
          </div>

          {/* 8-Phase Roadmap */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROADMAP_PHASES.map((item) => (
              <div
                key={item.phase}
                className={`rounded-xl border bg-white p-5 ${
                  item.status === 'Реализовано (v0.1.0)'
                    ? 'border-emerald-300'
                    : item.status === 'В работе'
                      ? 'border-blue-300'
                      : 'border-slate-200'
                }`}
              >
                <p className="font-mono text-xs text-slate-500">
                  {item.phase} ·{' '}
                  <span
                    className={
                      item.status === 'Реализовано (v0.1.0)'
                        ? 'font-semibold text-emerald-700'
                        : item.status === 'В работе'
                          ? 'font-semibold text-blue-700'
                          : item.status === 'Завершено'
                            ? 'font-semibold text-slate-700'
                            : 'text-slate-600'
                    }
                  >
                    {item.status}
                  </span>
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Project Success Criteria */}
          <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Критерии базовой инженерной зрелости OMR
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Контрольный список сквозного контура математической компетенции
                </p>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-slate-700">
                {Object.values(checkedCriteria).filter(Boolean).length} /{' '}
                {SUCCESS_CRITERIA.length}
              </span>
            </div>

            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUCCESS_CRITERIA.map((criterion, index) => {
                const checked = Boolean(checkedCriteria[index]);
                return (
                  <li key={criterion}>
                    <button
                      type="button"
                      onClick={() => toggleCriterion(index)}
                      className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left text-sm transition-colors hover:bg-slate-50 cursor-pointer"
                    >
                      {checked ? (
                        <CheckSquare
                          className="mt-0.5 h-4 w-4 shrink-0 text-blue-700"
                          aria-hidden="true"
                        />
                      ) : (
                        <Square
                          className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={checked ? 'text-slate-900' : 'text-slate-600'}
                      >
                        <span className="mr-1.5 font-mono text-xs tabular-nums text-slate-400">
                          {String(index + 1).padStart(2, '0')}.
                        </span>
                        {criterion}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Origami Mathematical Reasoning (OMR) · v0.1.0 · Apache-2.0</span>
          <div className="flex flex-wrap items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setActiveSection(item.id)}
                className="transition-colors hover:text-slate-900"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
