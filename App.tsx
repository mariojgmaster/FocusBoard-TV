import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useTVEventHandler,
} from 'react-native';

type TaskStatus = 'Pendente' | 'Em andamento' | 'Concluida';

type Task = {
  id: string;
  name: string;
  category: string;
  status: TaskStatus;
  responsible: string;
};

type FormMode = 'create' | 'edit';

type OverlayState =
  | {open: false}
  | {open: true; mode: FormMode; taskId: string | null};

const STATUS_OPTIONS: TaskStatus[] = ['Pendente', 'Em andamento', 'Concluida'];
const INITIAL_CATEGORIES = ['Planejamento', 'Comunicacao', 'Produto', 'Pessoal'];
const INITIAL_RESPONSIBLES = ['Mario', 'Ana', 'Carlos', 'Time'];

function App(): React.JSX.Element {
  const nextTaskId = useRef(1);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [responsibles, setResponsibles] = useState<string[]>(INITIAL_RESPONSIBLES);

  const [overlay, setOverlay] = useState<OverlayState>({open: false});

  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('Pendente');
  const [formCategory, setFormCategory] = useState(INITIAL_CATEGORIES[0]);
  const [formResponsible, setFormResponsible] = useState(INITIAL_RESPONSIBLES[0]);

  const [newCategory, setNewCategory] = useState('');
  const [newResponsible, setNewResponsible] = useState('');
  const [formError, setFormError] = useState('');

  const isOverlayOpen = overlay.open;
  const isCreateMode = overlay.open && overlay.mode === 'create';

  const editingTask = useMemo(() => {
    if (!overlay.open || overlay.mode !== 'edit' || !overlay.taskId) {
      return null;
    }

    return tasks.find(task => task.id === overlay.taskId) ?? null;
  }, [overlay, tasks]);

  const doneCount = useMemo(
    () => tasks.filter(task => task.status === 'Concluida').length,
    [tasks],
  );
  const pendingCount = tasks.length - doneCount;
  const progress = tasks.length > 0 ? doneCount / tasks.length : 0;

  const closeOverlay = useCallback(() => {
    Keyboard.dismiss();
    setOverlay({open: false});
    setFormError('');
  }, []);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormStatus('Pendente');
    setFormCategory(categories[0] ?? 'Geral');
    setFormResponsible(responsibles[0] ?? 'Time');
    setNewCategory('');
    setNewResponsible('');
    setFormError('');
  }, [categories, responsibles]);

  const openCreateOverlay = useCallback(() => {
    Keyboard.dismiss();
    resetForm();
    setOverlay({open: true, mode: 'create', taskId: null});
  }, [resetForm]);

  const openEditOverlay = useCallback((taskId: string) => {
    const target = tasks.find(task => task.id === taskId);
    if (!target) {
      return;
    }

    Keyboard.dismiss();
    setFormName(target.name);
    setFormStatus(target.status);
    setFormCategory(target.category);
    setFormResponsible(target.responsible);
    setNewCategory('');
    setNewResponsible('');
    setFormError('');
    setOverlay({open: true, mode: 'edit', taskId});
  }, [tasks]);

  const clearCompleted = useCallback(() => {
    setTasks(previous => previous.filter(task => task.status !== 'Concluida'));
  }, []);

  useEffect(() => {
    if (overlay.open && overlay.mode === 'edit' && !editingTask) {
      setOverlay({open: false});
    }
  }, [editingTask, overlay]);

  useTVEventHandler(event => {
    const eventType = event?.eventType;

    if (!eventType) {
      return;
    }

    if (eventType === 'playPause' && !isOverlayOpen) {
      clearCompleted();
      return;
    }

    if (isOverlayOpen && (eventType === 'menu' || eventType === 'back')) {
      closeOverlay();
    }
  });

  const addCategory = useCallback(() => {
    const value = newCategory.trim();
    if (!value) {
      return;
    }

    const existing = categories.find(
      item => item.toLowerCase() === value.toLowerCase(),
    );

    if (existing) {
      setFormCategory(existing);
    } else {
      setCategories(previous => [...previous, value]);
      setFormCategory(value);
    }

    setNewCategory('');
  }, [categories, newCategory]);

  const addResponsible = useCallback(() => {
    const value = newResponsible.trim();
    if (!value) {
      return;
    }

    const existing = responsibles.find(
      item => item.toLowerCase() === value.toLowerCase(),
    );

    if (existing) {
      setFormResponsible(existing);
    } else {
      setResponsibles(previous => [...previous, value]);
      setFormResponsible(value);
    }

    setNewResponsible('');
  }, [newResponsible, responsibles]);

  const buildResolvedFormValues = useCallback(() => {
    const categoryDraft = newCategory.trim();
    const responsibleDraft = newResponsible.trim();

    let resolvedCategory = formCategory;
    let resolvedResponsible = formResponsible;

    if (categoryDraft) {
      const existingCategory = categories.find(
        item => item.toLowerCase() === categoryDraft.toLowerCase(),
      );
      resolvedCategory = existingCategory ?? categoryDraft;
      if (!existingCategory) {
        setCategories(previous => [...previous, categoryDraft]);
      }
      setNewCategory('');
    }

    if (responsibleDraft) {
      const existingResponsible = responsibles.find(
        item => item.toLowerCase() === responsibleDraft.toLowerCase(),
      );
      resolvedResponsible = existingResponsible ?? responsibleDraft;
      if (!existingResponsible) {
        setResponsibles(previous => [...previous, responsibleDraft]);
      }
      setNewResponsible('');
    }

    return {resolvedCategory, resolvedResponsible};
  }, [
    categories,
    formCategory,
    formResponsible,
    newCategory,
    newResponsible,
    responsibles,
  ]);

  const saveTask = useCallback(() => {
    const trimmedName = formName.trim();
    const resolvedName = trimmedName || `Tarefa ${nextTaskId.current}`;
    const {resolvedCategory, resolvedResponsible} = buildResolvedFormValues();

    if (!resolvedCategory || !resolvedResponsible) {
      setFormError('Escolha categoria e responsavel.');
      return;
    }

    if (isCreateMode) {
      const created: Task = {
        id: String(nextTaskId.current++),
        name: resolvedName,
        category: resolvedCategory,
        status: formStatus,
        responsible: resolvedResponsible,
      };

      setTasks(previous => [created, ...previous]);
      closeOverlay();
      return;
    }

    if (!overlay.open || overlay.mode !== 'edit' || !overlay.taskId) {
      return;
    }

    setTasks(previous =>
      previous.map(task =>
        task.id === overlay.taskId
          ? {
              ...task,
              name: resolvedName,
              category: resolvedCategory,
              status: formStatus,
              responsible: resolvedResponsible,
            }
          : task,
      ),
    );

    closeOverlay();
  }, [
    buildResolvedFormValues,
    closeOverlay,
    formName,
    formStatus,
    isCreateMode,
    overlay,
  ]);

  const deleteTask = useCallback(() => {
    if (!overlay.open || overlay.mode !== 'edit' || !overlay.taskId) {
      return;
    }

    setTasks(previous => previous.filter(task => task.id !== overlay.taskId));
    closeOverlay();
  }, [closeOverlay, overlay]);

  const cycleTaskStatus = useCallback((taskId: string) => {
    setTasks(previous =>
      previous.map(task => {
        if (task.id !== taskId) {
          return task;
        }

        if (task.status === 'Pendente') {
          return {...task, status: 'Em andamento'};
        }

        if (task.status === 'Em andamento') {
          return {...task, status: 'Concluida'};
        }

        return {...task, status: 'Pendente'};
      }),
    );
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.heroGlow} />

      <View pointerEvents={isOverlayOpen ? 'none' : 'auto'} style={styles.shell}>
        <View style={styles.dashboardPanel}>
          <Text style={styles.brand}>FocusBoard TV</Text>
          <Text style={styles.subtitle}>Painel de tarefas para Android TV</Text>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total</Text>
            <Text style={styles.metricValue}>{tasks.length}</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricMiniCard}>
              <Text style={styles.metricMiniLabel}>Pendentes</Text>
              <Text style={styles.metricMiniValue}>{pendingCount}</Text>
            </View>
            <View style={styles.metricMiniCard}>
              <Text style={styles.metricMiniLabel}>Concluidas</Text>
              <Text style={styles.metricMiniValue}>{doneCount}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${Math.round(progress * 100)}%`}]} />
          </View>

          <Pressable
            focusable={!isOverlayOpen}
            hasTVPreferredFocus={tasks.length === 0 && !isOverlayOpen}
            onPress={openCreateOverlay}
            style={({focused}) => [
              styles.dashboardButton,
              focused && styles.dashboardButtonFocused,
            ]}>
            <Text style={styles.dashboardButtonText}>Nova Tarefa</Text>
          </Pressable>

          <Pressable
            focusable={!isOverlayOpen}
            onPress={clearCompleted}
            style={({focused}) => [
              styles.dashboardButton,
              focused && styles.dashboardButtonFocused,
            ]}>
            <Text style={styles.dashboardButtonText}>Limpar concluidas</Text>
          </Pressable>

          <Text style={styles.hint}>Dica: Play/Pause limpa concluidas</Text>
        </View>

        <View style={styles.listPanel}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Tarefas</Text>
            <Text style={styles.listSubtitle}>{pendingCount} pendentes</Text>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {tasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Sem tarefas</Text>
                <Text style={styles.emptyText}>Crie uma nova tarefa para iniciar.</Text>
              </View>
            ) : (
              tasks.map((item, index) => (
                <View key={item.id} style={styles.taskRow}>
                  <Pressable
                    focusable={!isOverlayOpen}
                    hasTVPreferredFocus={index === 0 && !isOverlayOpen}
                    onPress={() => openEditOverlay(item.id)}
                    style={({focused}) => [
                      styles.taskInfoCard,
                      item.status === 'Concluida' && styles.taskInfoCardDone,
                      focused && styles.taskInfoCardFocused,
                    ]}>
                    <View
                      style={[
                        styles.statusDot,
                        item.status === 'Concluida' && styles.statusDotDone,
                      ]}
                    />

                    <View style={styles.taskBody}>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.taskName}>
                        {item.name}
                      </Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.taskMeta}>
                        {item.category} | {item.responsible}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    focusable={!isOverlayOpen}
                    onPress={() => cycleTaskStatus(item.id)}
                    style={({focused}) => [
                      styles.taskStatusCard,
                      item.status === 'Concluida' && styles.taskStatusCardDone,
                      item.status === 'Em andamento' && styles.taskStatusCardInProgress,
                      focused && styles.taskStatusCardFocused,
                    ]}>
                    <Text style={styles.statusPillText}>{item.status}</Text>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {isOverlayOpen && (
        <View style={styles.overlayBackdrop}>
          <View style={styles.overlayCard}>
            <ScrollView
              style={styles.overlayScroll}
              contentContainerStyle={styles.overlayScrollContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.overlayTitle}>
                {isCreateMode ? 'Nova Tarefa' : 'Editar Tarefa'}
              </Text>

              <Text style={styles.formLabel}>Nome</Text>
              <TextInput
                value={formName}
                onChangeText={text => {
                  setFormName(text);
                  if (formError) {
                    setFormError('');
                  }
                }}
                placeholder="Ex: Revisar planejamento da sprint"
                placeholderTextColor="#8A9AA3"
                style={styles.input}
              />

              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.chipsWrap}>
                {STATUS_OPTIONS.map((status, index) => (
                  <Pressable
                    key={status}
                    focusable={isOverlayOpen}
                    hasTVPreferredFocus={index === 0}
                    onPress={() => setFormStatus(status)}
                    style={({focused}) => [
                      styles.chip,
                      formStatus === status && styles.chipSelected,
                      focused && styles.chipFocused,
                    ]}>
                    <Text style={styles.chipText}>{status}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.formLabel}>Categoria</Text>
              <View style={styles.chipsWrap}>
                {categories.map(category => (
                  <Pressable
                    key={category}
                    focusable={isOverlayOpen}
                    onPress={() => setFormCategory(category)}
                    style={({focused}) => [
                      styles.chip,
                      formCategory === category && styles.chipSelected,
                      focused && styles.chipFocused,
                    ]}>
                    <Text style={styles.chipText}>{category}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.inlineFormRow}>
                <TextInput
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Nova categoria"
                  placeholderTextColor="#8A9AA3"
                  style={[styles.input, styles.inlineInput]}
                />
                <Pressable
                  focusable={isOverlayOpen}
                  onPress={addCategory}
                  style={({focused}) => [
                    styles.inlineButton,
                    focused && styles.inlineButtonFocused,
                  ]}>
                  <Text style={styles.inlineButtonText}>Adicionar</Text>
                </Pressable>
              </View>

              <Text style={styles.formLabel}>Responsavel</Text>
              <View style={styles.chipsWrap}>
                {responsibles.map(person => (
                  <Pressable
                    key={person}
                    focusable={isOverlayOpen}
                    onPress={() => setFormResponsible(person)}
                    style={({focused}) => [
                      styles.chip,
                      formResponsible === person && styles.chipSelected,
                      focused && styles.chipFocused,
                    ]}>
                    <Text style={styles.chipText}>{person}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.inlineFormRow}>
                <TextInput
                  value={newResponsible}
                  onChangeText={setNewResponsible}
                  placeholder="Novo responsavel"
                  placeholderTextColor="#8A9AA3"
                  style={[styles.input, styles.inlineInput]}
                />
                <Pressable
                  focusable={isOverlayOpen}
                  onPress={addResponsible}
                  style={({focused}) => [
                    styles.inlineButton,
                    focused && styles.inlineButtonFocused,
                  ]}>
                  <Text style={styles.inlineButtonText}>Adicionar</Text>
                </Pressable>
              </View>

              {!!formError && <Text style={styles.errorText}>{formError}</Text>}

              <View style={styles.overlayActions}>
                {!isCreateMode && (
                  <Pressable
                    focusable={isOverlayOpen}
                    onPress={deleteTask}
                    style={({focused}) => [
                      styles.actionButton,
                      styles.deleteButton,
                      focused && styles.deleteButtonFocused,
                    ]}>
                    <Text style={styles.actionButtonText}>Deletar</Text>
                  </Pressable>
                )}

                <Pressable
                  focusable={isOverlayOpen}
                  onPress={closeOverlay}
                  style={({focused}) => [
                    styles.actionButton,
                    focused && styles.actionButtonFocused,
                  ]}>
                  <Text style={styles.actionButtonText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  focusable={isOverlayOpen}
                  onPress={saveTask}
                  style={({focused}) => [
                    styles.actionButton,
                    styles.primaryActionButton,
                    focused && styles.primaryActionButtonFocused,
                  ]}>
                  <Text style={styles.actionButtonText}>
                    {isCreateMode ? 'Criar' : 'Salvar'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 36,
    paddingVertical: 20,
  },
  heroGlow: {
    position: 'absolute',
    top: -160,
    right: -120,
    width: 560,
    height: 560,
    borderRadius: 280,
    backgroundColor: '#1F3A4A',
    opacity: 0.3,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  dashboardPanel: {
    width: '33%',
    backgroundColor: '#171717E8',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    padding: 14,
  },
  listPanel: {
    width: '67%',
    minHeight: 0,
    backgroundColor: '#171717E8',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    padding: 14,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: '#AEBBC2',
    fontSize: 15,
  },
  metricCard: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    padding: 12,
  },
  metricLabel: {
    color: '#90A4AE',
    fontSize: 14,
  },
  metricValue: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  metricMiniCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    padding: 10,
  },
  metricMiniLabel: {
    color: '#90A4AE',
    fontSize: 13,
  },
  metricMiniValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4FC3F7',
  },
  dashboardButton: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#222B31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardButtonFocused: {
    backgroundColor: '#2E4551',
    transform: [{scale: 1.02}],
  },
  dashboardButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    marginTop: 10,
    color: '#90A4AE',
    fontSize: 14,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  listSubtitle: {
    color: '#AEBBC2',
    fontSize: 15,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingTop: 4,
    paddingBottom: 16,
  },
  taskRow: {
    flexDirection: 'row',
    gap: 6,
  },
  taskInfoCard: {
    minHeight: 70,
    flex: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#1D1D1D',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfoCardDone: {
    backgroundColor: '#173025',
  },
  taskInfoCardFocused: {
    backgroundColor: '#2D3F4A',
    transform: [{scale: 1.015}],
  },
  taskStatusCard: {
    minWidth: 180,
    minHeight: 70,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#4E3B1F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  taskStatusCardDone: {
    backgroundColor: '#1D5A3A',
  },
  taskStatusCardInProgress: {
    backgroundColor: '#1D4961',
  },
  taskStatusCardFocused: {
    backgroundColor: '#355A70',
    transform: [{scale: 1.015}],
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFA726',
  },
  statusDotDone: {
    backgroundColor: '#66BB6A',
  },
  taskBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  taskName: {
    color: '#F4F4F4',
    fontSize: 18,
    fontWeight: '600',
  },
  taskMeta: {
    marginTop: 2,
    color: '#9FB0B8',
    fontSize: 14,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 6,
    color: '#B0BEC5',
    fontSize: 16,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0E12B8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 70,
    paddingVertical: 40,
    zIndex: 20,
  },
  overlayCard: {
    width: '92%',
    maxWidth: 1060,
    maxHeight: '88%',
    borderRadius: 18,
    backgroundColor: '#1A1A1AF2',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  overlayScroll: {
    width: '100%',
  },
  overlayScrollContent: {
    paddingBottom: 8,
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
  },
  formLabel: {
    color: '#B0BEC5',
    fontSize: 15,
    marginTop: 7,
    marginBottom: 5,
  },
  input: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#111A1F',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#1B252B',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: '#2A4A5D',
  },
  chipFocused: {
    backgroundColor: '#355A70',
    transform: [{scale: 1.02}],
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  inlineFormRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  inlineInput: {
    flex: 1,
  },
  inlineButton: {
    minWidth: 124,
    borderRadius: 10,
    backgroundColor: '#1B252B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  inlineButtonFocused: {
    backgroundColor: '#2A4A5D',
  },
  inlineButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: '#EF9A9A',
    fontSize: 15,
    fontWeight: '600',
  },
  overlayActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    minWidth: 120,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#1B252B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionButtonFocused: {
    backgroundColor: '#2A3A45',
  },
  primaryActionButton: {
    backgroundColor: '#1E4253',
  },
  primaryActionButtonFocused: {
    backgroundColor: '#28556B',
  },
  deleteButton: {
    backgroundColor: '#5A2323',
  },
  deleteButtonFocused: {
    backgroundColor: '#7A2F2F',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default App;
