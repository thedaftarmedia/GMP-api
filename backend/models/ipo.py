from typing import Literal

from pydantic import BaseModel, Field


IpoCategory = Literal["mainboard", "sme"]


class IPO(BaseModel):
    id: str
    name: str
    category: IpoCategory
    status: str
    price: float | None = None
    gmp: float | None = None
    gmpPercentage: float | None = None
    estimatedListing: float | None = None
    estimatedListingPercentage: float | None = None
    expectedProfit: float | None = None
    profitType: Literal["profit", "loss"] | None = None
    lotSize: float | None = None
    issueSize: float | None = None
    subscription: float | None = None
    biddingStartDate: str | None = None
    biddingEndDate: str | None = None
    sourceUrl: str | None = None
    sourceId: str
    scrapedAt: str
    updatedAt: str
    lastSeenAt: str
    active: bool = True


class IpoGroups(BaseModel):
    mainboard: list[IPO] = Field(default_factory=list)
    sme: list[IPO] = Field(default_factory=list)


class IposResponse(BaseModel):
    success: bool
    available: bool
    data: IpoGroups
    message: str | None = None


class HealthResponse(BaseModel):
    status: Literal["ok"]