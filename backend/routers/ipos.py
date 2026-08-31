from typing import Any

from fastapi import APIRouter, HTTPException

from lib.convex import ConvexUnavailable, call_convex
from models.ipo import IPO, IpoGroups, IposResponse


router = APIRouter()


def _map_ipo(document: dict[str, Any]) -> IPO:
    return IPO(
        id=str(document.get("id") or document.get("_id") or document["sourceId"]),
        name=document["name"],
        category=document["category"],
        status=document["status"],
        price=document.get("price"),
        gmp=document.get("gmp"),
        gmpPercentage=document.get("gmpPercentage"),
        estimatedListing=document.get("estimatedListing"),
        estimatedListingPercentage=document.get("estimatedListingPercentage"),
        expectedProfit=document.get("expectedProfit"),
        profitType=document.get("profitType"),
        lotSize=document.get("lotSize"),
        issueSize=document.get("issueSize"),
        subscription=document.get("subscription"),
        biddingStartDate=document.get("biddingStartDate"),
        biddingEndDate=document.get("biddingEndDate"),
        sourceUrl=document.get("sourceUrl"),
        sourceId=document["sourceId"],
        scrapedAt=document["scrapedAt"],
        updatedAt=document["updatedAt"],
        lastSeenAt=document.get("lastSeenAt") or document["updatedAt"],
        active=document.get("active", True),
    )


def _unavailable_response() -> IposResponse:
    return IposResponse(
        success=False,
        available=False,
        data=IpoGroups(),
        message="IPO data is unavailable until the Convex deployment is configured.",
    )


@router.get("/ipos", response_model=IposResponse)
async def list_ipos() -> IposResponse:
    try:
        documents = await call_convex("query", "ipos:listIpos", {})
    except ConvexUnavailable:
        return _unavailable_response()

    groups = IpoGroups()
    for document in documents or []:
        ipo = _map_ipo(document)
        if ipo.active:
            getattr(groups, ipo.category).append(ipo)
    groups.mainboard.sort(key=lambda item: item.updatedAt, reverse=True)
    groups.sme.sort(key=lambda item: item.updatedAt, reverse=True)
    return IposResponse(success=True, available=True, data=groups)


@router.get("/ipos/{ipo_id}", response_model=IPO)
async def get_ipo(ipo_id: str) -> IPO:
    try:
        document = await call_convex("query", "ipos:getIpo", {"id": ipo_id})
    except ConvexUnavailable as exc:
        raise HTTPException(status_code=503, detail="IPO data is temporarily unavailable") from exc
    if not document:
        raise HTTPException(status_code=404, detail="IPO not found")
    return _map_ipo(document)