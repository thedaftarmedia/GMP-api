import { Router } from "express";

import { callConvex, ConvexUnavailable } from "../services/convex.js";
import {
  normalizeIpo,
  type ConvexIPODocument,
  type IpoGroups,
  type IposResponse,
} from "../types/ipo.js";

export const iposRouter = Router();

function unavailableResponse(): IposResponse {
  return {
    success: false,
    available: false,
    data: { mainboard: [], sme: [] },
    message: "IPO data is unavailable until the Convex deployment is configured.",
  };
}

iposRouter.get("/", async (_request, response) => {
  try {
    const documents = await callConvex<ConvexIPODocument[]>("query", "ipos:listIpos", {});
    const groups: IpoGroups = { mainboard: [], sme: [] };
    for (const document of documents) {
      const ipo = normalizeIpo(document);
      if (ipo.active) groups[ipo.category].push(ipo);
    }
    groups.mainboard.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    groups.sme.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const payload: IposResponse = { success: true, available: true, data: groups };
    response.json(payload);
  } catch (error) {
    if (error instanceof ConvexUnavailable) {
      response.json(unavailableResponse());
      return;
    }
    response.status(500).json({ detail: "Unable to load IPO data" });
  }
});

iposRouter.get("/:id", async (request, response) => {
  try {
    const document = await callConvex<ConvexIPODocument | null>("query", "ipos:getIpo", {
      id: request.params.id,
    });
    if (!document) {
      response.status(404).json({ detail: "IPO not found" });
      return;
    }
    response.json(normalizeIpo(document));
  } catch (error) {
    if (error instanceof ConvexUnavailable) {
      response.status(503).json({ detail: "IPO data is temporarily unavailable" });
      return;
    }
    response.status(500).json({ detail: "Unable to load IPO data" });
  }
});