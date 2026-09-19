package com.frenchnclc7.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.PlansState
import com.frenchnclc7.app.data.BillingPeriod
import com.frenchnclc7.app.data.PlanCell
import com.frenchnclc7.app.data.PlansLogic
import com.frenchnclc7.app.data.Tier

/** Free versus Premium, with a monthly/yearly choice. Buying goes through Google Play Billing (not connected yet). */
@Composable
fun PlansScreen(p: PlansState, tier: Tier, vm: AppViewModel) {
    val c = LocalColors.current
    val yearly = p.period == BillingPeriod.YEARLY

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("‹", color = c.muted, fontSize = 24.sp, modifier = Modifier.clickable { vm.home() }.padding(end = 10.dp))
            Text("Plans", color = c.muted, fontSize = 12.sp)
        }
        Spacer(Modifier.height(16.dp))
        Text(
            "Study every day for NCLC 7, with less friction", color = c.text, fontSize = 22.sp, fontFamily = FontFamily.Serif,
            textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Cancel anytime. Your progress always stays with you.", color = c.muted, fontSize = 12.sp,
            textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(14.dp))

        // Monthly | Yearly
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
            Row(
                Modifier.clip(RoundedCornerShape(50)).background(c.card).border(BorderStroke(1.dp, c.border), RoundedCornerShape(50)).padding(3.dp),
            ) {
                listOf(BillingPeriod.MONTHLY to "Monthly", BillingPeriod.YEARLY to "Yearly").forEach { (period, label) ->
                    val on = p.period == period
                    Text(
                        label, fontSize = 13.sp, color = if (on) c.bg else c.muted,
                        modifier = Modifier.clip(RoundedCornerShape(50)).background(if (on) c.text else c.card)
                            .clickable { vm.setPlanPeriod(period) }.padding(horizontal = 18.dp, vertical = 8.dp),
                    )
                }
            }
        }
        Spacer(Modifier.height(16.dp))

        // Free
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card).border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(16.dp)) {
            Text("Free", color = c.muted, fontSize = 12.sp)
            Text("$0", color = c.text, fontSize = 26.sp, fontWeight = FontWeight.Medium)
            Text("forever", color = c.muted, fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))
            Text("The full 301-day plan, all five sections.", color = c.muted, fontSize = 12.sp)
            if (tier == Tier.FREE) {
                Spacer(Modifier.height(12.dp))
                StatusPill("Your current plan")
            }
        }
        Spacer(Modifier.height(12.dp))

        // Premium
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card).border(BorderStroke(2.dp, c.accent), RoundedCornerShape(16.dp)).padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Premium", color = c.muted, fontSize = 12.sp, modifier = Modifier.weight(1f))
                if (yearly) {
                    Text(
                        "Best value", color = c.link, fontSize = 12.sp,
                        modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(c.accentSoft).padding(horizontal = 10.dp, vertical = 3.dp),
                    )
                }
            }
            Row(verticalAlignment = Alignment.Bottom) {
                Text(p.period.price, color = c.text, fontSize = 26.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.width(6.dp))
                Text(p.period.per, color = c.muted, fontSize = 12.sp, modifier = Modifier.padding(bottom = 5.dp))
            }
            Text(PlansLogic.note(p.period), color = c.link, fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))
            Text("Real lesson links, PDFs, and more AI feedback.", color = c.muted, fontSize = 12.sp)
            Spacer(Modifier.height(12.dp))

            when (tier) {
                Tier.FREE -> ActionButton(if (p.busy) "Opening Google Play…" else "Upgrade to Premium", filled = true) { if (!p.busy) vm.upgrade() }
                Tier.PREMIUM -> {
                    StatusPill("Your current plan")
                    Spacer(Modifier.height(8.dp))
                    ActionButton("Manage subscription", filled = false) { if (!p.busy) vm.manageSubscription() }
                }
                Tier.SUPER -> StatusPill("You have Super, which includes Premium")
            }
            p.message?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
            }
        }
        Spacer(Modifier.height(12.dp))

        // Comparison
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card).border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(horizontal = 14.dp, vertical = 8.dp)) {
            Row(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                Text("Feature", color = c.muted, fontSize = 12.sp, modifier = Modifier.weight(1f))
                Text("Free", color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.width(76.dp))
                Text("Premium", color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.width(76.dp))
            }
            PlansLogic.groups.forEach { g ->
                Text(
                    g.title, color = c.muted, fontSize = 12.sp,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(6.dp)).background(c.accentSoft).padding(horizontal = 8.dp, vertical = 5.dp),
                )
                g.rows.forEach { r ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(r.label, color = c.text, fontSize = 12.sp, modifier = Modifier.weight(1f).padding(end = 6.dp))
                        Box(Modifier.width(76.dp), contentAlignment = Alignment.Center) { CellView(r.free) }
                        Box(Modifier.width(76.dp), contentAlignment = Alignment.Center) { CellView(r.premium) }
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        Text(
            "Subscriptions are billed by Google Play. We never see your card details.", color = c.muted, fontSize = 11.sp,
            textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun CellView(cell: PlanCell) {
    val c = LocalColors.current
    when (cell) {
        PlanCell.Included -> Text("✓", color = c.accent, fontSize = 15.sp, fontWeight = FontWeight.Medium)
        PlanCell.NotIncluded -> Text("–", color = c.muted, fontSize = 15.sp)
        is PlanCell.Text -> Text(cell.value, color = c.muted, fontSize = 11.sp, textAlign = TextAlign.Center)
    }
}

@Composable
private fun StatusPill(text: String) {
    val c = LocalColors.current
    Text(
        text, color = c.muted, fontSize = 13.sp, textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.accentSoft).padding(vertical = 11.dp),
    )
}

@Composable
private fun ActionButton(text: String, filled: Boolean, onClick: () -> Unit) {
    val c = LocalColors.current
    val shape = RoundedCornerShape(12.dp)
    Text(
        text, color = if (filled) c.onAccent else c.link, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().clip(shape)
            .then(if (filled) Modifier.background(c.accent) else Modifier.border(BorderStroke(1.dp, c.border), shape))
            .clickable(onClick = onClick).padding(vertical = 13.dp),
    )
}
