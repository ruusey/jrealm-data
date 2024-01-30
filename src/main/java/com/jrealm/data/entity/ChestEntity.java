package com.jrealm.data.entity;

import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player_chest")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class ChestEntity extends TemporalEntity{
	private static final long serialVersionUID = 7607170635634825869L;
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer chestId;
	private Integer accountId;
	private Integer ordinal;
	@OneToMany(cascade = { CascadeType.PERSIST }, fetch = FetchType.EAGER, targetEntity = GameItemRefEntity.class)
	@JoinColumn(foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	private Set<GameItemRefEntity> items;
}
