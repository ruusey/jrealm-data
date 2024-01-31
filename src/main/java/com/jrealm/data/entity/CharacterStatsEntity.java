package com.jrealm.data.entity;

import java.util.Objects;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.Table;

import com.jrealm.game.data.GameDataManager;
import com.jrealm.game.model.CharacterClassModel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player_character_stats")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class CharacterStatsEntity extends TemporalEntity {
	private static final long serialVersionUID = 186218452080820122L;
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer characterStatsId;
	private Long xp;
	private Integer classId;
	private Integer hp;
	private Integer mp;
	private Integer def;
	private Integer att;
	private Integer spd;
	private Integer dex;
	private Integer vit;
	private Integer wis;
	
	@OneToOne
    @JoinColumn(name = "character_id")
	private CharacterEntity ownerCharacter;
	
	public static CharacterStatsEntity characterDefaults(final Integer characterClass) {
		final CharacterClassModel model = GameDataManager.CHARACTER_CLASSES.get(characterClass);
		return CharacterStatsEntity.builder()
				.xp(0l)
				.hp((int)model.getBaseStats().getHp())
				.mp((int)model.getBaseStats().getMp())
				.def((int)model.getBaseStats().getDef())
				.att((int)model.getBaseStats().getAtt())
				.spd((int)model.getBaseStats().getSpd())
				.dex((int)model.getBaseStats().getDex())
				.vit((int)model.getBaseStats().getVit())
				.wis((int)model.getBaseStats().getWis())
				.build();
	}
	
	@Override
	public int hashCode() {
		return Objects.hash(characterStatsId, xp, classId, hp, mp, def, att, spd, dex, vit, wis);
	}
	
	@Override
	public String toString() {
		return characterStatsId+", "+this.xp+", "+this.classId;
	}
	
}
