import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { getMailingBlocks, createMailingBlock, updateMailingBlock, deleteMailingBlock } from "../services/mailingBlockService";
import { getMailingTemplateBlock } from "../services/mailingTemplateBlockService";
import { buildMailingMjml, compileMjml } from "../utils/mjmlUtils";
import { renderSmartBlock, resolveSmartType } from "../features/mailings/smartBlockRenderers";
import { useUpdateMailing } from "./crudResourceHooks";

function resolveBlockDef(mailingBlock, blockDefsById) {
  const rawBlock = mailingBlock?.block;
  const blockId = typeof rawBlock === "string" ? rawBlock : rawBlock?.id;

  return (
    (blockId ? blockDefsById[blockId] : undefined) ||
    (typeof rawBlock === "object" ? rawBlock : undefined) ||
    mailingBlock?.expand?.block
  );
}

function resolveBlockId(mailingBlock) {
  const rawBlock = mailingBlock?.block;
  return typeof rawBlock === "string" ? rawBlock : (rawBlock?.id ?? mailingBlock?.expand?.block?.id);
}

export function useMailingEditor(mailingId) {
  const queryClient = useQueryClient();
  const { mutateAsync: updateMailing, isPending: isSaving } = useUpdateMailing();
  const [isSending, setIsSending] = useState(false);

  const [mailingBlocks, setMailingBlocks] = useState([]);
  const [blockContents, setBlockContents] = useState({});

  const { data: blocksData, isLoading: blocksLoading } = useQuery({
    queryKey: ["mailingBlocks", mailingId],
    queryFn: () => getMailingBlocks({ filter: `mailing="${mailingId}"`, sort: "sort_order,+created", expand: "block" }),
    enabled: !!mailingId,
  });

  useEffect(() => {
    if (blocksData?.items) {
      setMailingBlocks(blocksData.items);
      const contents = {};
      for (const mb of blocksData.items) {
        contents[mb.id] = mb.content ?? {};
      }
      setBlockContents(contents);
    }
  }, [blocksData]);

  const blockDefsById = useMemo(() => {
    const map = {};
    for (const mb of mailingBlocks) {
      if (mb.expand?.block) map[mb.expand.block.id] = mb.expand.block;
    }
    return map;
  }, [mailingBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = mailingBlocks.findIndex((b) => b.id === active.id);
      const newIndex = mailingBlocks.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(mailingBlocks, oldIndex, newIndex);
      setMailingBlocks(reordered);

      await Promise.all(reordered.map((mb, idx) => updateMailingBlock(mb.id, { sort_order: idx })));
      queryClient.invalidateQueries({ queryKey: ["mailingBlocks", mailingId] });
    },
    [mailingBlocks, mailingId, queryClient],
  );

  const handleAddBlock = useCallback(
    async (blockDef) => {
      const newBlock = await createMailingBlock({ mailing: mailingId, block: blockDef.id, content: {} });
      setMailingBlocks((prev) => [...prev, { ...newBlock, block: newBlock.block ?? blockDef.id }]);
      setBlockContents((prev) => ({ ...prev, [newBlock.id]: {} }));
      queryClient.invalidateQueries({ queryKey: ["mailingBlocks", mailingId] });
    },
    [mailingId, queryClient],
  );

  const handleRemoveBlock = useCallback(async (blockId) => {
    if (!window.confirm("Blok verwijderen?")) return;
    await deleteMailingBlock(blockId);
    setMailingBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setBlockContents((prev) => {
      const copy = { ...prev };
      delete copy[blockId];
      return copy;
    });
  }, []);

  const handleContentChange = useCallback((blockId, fieldId, value) => {
    setBlockContents((prev) => ({
      ...prev,
      [blockId]: { ...(prev[blockId] ?? {}), [fieldId]: value },
    }));
  }, []);

  const buildPreviewMjml = useCallback(
    async (formData, templates) => {
      const tpl = templates.find((t) => t.id === formData.template);
      let smartRenderedCount = 0;
      const blocksWithContent = await Promise.all(
        mailingBlocks.map(async (mb) => {
          let blockDef = resolveBlockDef(mb, blockDefsById);

          if (!blockDef) {
            const blockId = resolveBlockId(mb);
            if (blockId) {
              try {
                blockDef = await getMailingTemplateBlock(blockId);
              } catch {
                // Keep fallback empty block MJML if block definition cannot be fetched.
              }
            }
          }

          const smartType = resolveSmartType(blockDef);
          if (smartType) {
            smartRenderedCount += 1;
            const params = blockContents[mb.id] ?? mb.content ?? {};
            const smartMjml = await renderSmartBlock(smartType, params);
            return { ...mb, smartMjml };
          }
          return {
            ...mb,
            blockMjml: blockDef?.mjml ?? "",
            content: blockContents[mb.id] ?? mb.content ?? {},
          };
        }),
      );

      const mjml = buildMailingMjml(tpl?.layout ?? "", blocksWithContent);
      const diagnosticMjml =
        '<mj-section padding="2px 0"><mj-column><mj-text font-size="10px" color="#9ca3af">' +
        "PREVIEW blocks=" +
        mailingBlocks.length +
        " smart=" +
        smartRenderedCount +
        "</mj-text></mj-column></mj-section>";

      if (mjml.includes("</mj-body>")) {
        return mjml.replace("</mj-body>", diagnosticMjml + "\n</mj-body>");
      }
      return mjml + "\n" + diagnosticMjml;
    },
    [mailingBlocks, blockDefsById, blockContents],
  );

  const handleSave = useCallback(
    async (formData, templates) => {
      let html = "";
      try {
        html = await compileMjml(await buildPreviewMjml(formData, templates));
      } catch (err) {
        alert(`HTML generatie mislukt: ${err.message}`);
        return;
      }
      await updateMailing({ id: mailingId, data: { ...formData, state: "draft", html } });
      await Promise.all(mailingBlocks.map((mb) => updateMailingBlock(mb.id, { content: blockContents[mb.id] ?? {} })));
      queryClient.invalidateQueries({ queryKey: ["mailingBlocks", mailingId] });
    },
    [mailingId, mailingBlocks, blockContents, buildPreviewMjml, updateMailing, queryClient],
  );

  const handleSend = useCallback(
    async (formData, templates, navigate) => {
      if (!formData.to || !formData.subject) {
        alert("Vul een ontvanger en onderwerp in.");
        return;
      }
      if (!window.confirm(`E-mail verzenden naar ${formData.to}?`)) return;
      setIsSending(true);
      try {
        let html = "";
        try {
          html = await compileMjml(await buildPreviewMjml(formData, templates));
        } catch (err) {
          alert(`HTML generatie mislukt: ${err.message}`);
          return;
        }
        await updateMailing({ id: mailingId, data: { ...formData, state: "draft", html } });
        await Promise.all(mailingBlocks.map((mb) => updateMailingBlock(mb.id, { content: blockContents[mb.id] ?? {} })));
        await updateMailing({ id: mailingId, data: { state: "sent", sent: new Date().toISOString() } });
        navigate("/mailings");
      } catch (err) {
        alert(`Verzenden mislukt: ${err.message}`);
      } finally {
        setIsSending(false);
      }
    },
    [mailingId, mailingBlocks, blockContents, buildPreviewMjml, updateMailing],
  );

  return {
    mailingBlocks,
    blockContents,
    blockDefsById,
    blocksLoading,
    sensors,
    handleDragEnd,
    handleAddBlock,
    handleRemoveBlock,
    handleContentChange,
    buildPreviewMjml,
    handleSave,
    handleSend,
    isSaving,
    isSending,
  };
}
